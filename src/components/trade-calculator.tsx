"use client";

import * as React from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, ArrowUpDownIcon, InfoIcon, LoaderCircleIcon, PlusIcon, SearchIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { PositionBadge } from "@/components/position-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { headshotUrl } from "@/lib/display";
import type { MarketPlayer } from "@/lib/player-market";
import type { RaTrade, TradeAssetInput } from "@/lib/roster-audit";
import type { PickOption, TradeLabData, TradePlayer } from "@/lib/trade-lab";
import { cn } from "@/lib/utils";
import { basisMeta, sumValues } from "@/lib/value-basis";

/** One asset staged on a side. `key` is what the UI dedupes and removes by. */
type StagedAsset = { key: string; name: string; detail: string; position?: string | null; imageUrl?: string; value: number; input: TradeAssetInput };

type CalculateResponse = { trade?: RaTrade; error?: string };

const formatter = new Intl.NumberFormat("en-US");
const ANY_TEAM = "any";
const SUGGESTION_LIMIT = 8;

const playerAsset = (player: TradePlayer | MarketPlayer["player"] & { value?: number }, value: number): StagedAsset => ({
  key: `player:${player.id}`,
  name: player.name,
  detail: [player.team ?? "FA", player.age ? `${player.age} yrs` : null].filter(Boolean).join(" · "),
  position: player.position,
  imageUrl: headshotUrl(player),
  value,
  input: { type: "player", id: player.id },
});

const pickAsset = (pick: PickOption): StagedAsset => ({
  key: `pick:${pick.season}:${pick.round}:${pick.slot}`,
  name: pick.label,
  detail: `${pick.season} draft pick`,
  value: pick.value,
  input: { type: "pick", season: pick.season, round: pick.round, slot: pick.slot },
});

const gradeTone = (grade: string) => grade.startsWith("A") || grade.startsWith("B")
  ? "border-positive/30 bg-positive/10 text-positive"
  : grade.startsWith("C")
    ? "border-warning/30 bg-warning/10 text-warning-foreground"
    : "border-negative/30 bg-negative/10 text-negative";

function TeamSelect({ label, teams, value, onChange }: { label: string; teams: TradeLabData["teams"]; value: string; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={(next) => { if (next) onChange(next); }}>
    {/* Base UI renders the raw value unless the label is resolved here, and roster ids are not names. */}
    <SelectTrigger aria-label={label} className="w-full" size="sm"><SelectValue>{(selected) => selected === ANY_TEAM ? "Any player (hypothetical)" : teams.find((team) => String(team.rosterId) === selected)?.name ?? "Select a team"}</SelectValue></SelectTrigger>
    <SelectContent>
      <SelectItem value={ANY_TEAM}>Any player (hypothetical)</SelectItem>
      {teams.map((team) => <SelectItem key={team.rosterId} value={String(team.rosterId)}>{team.name}</SelectItem>)}
    </SelectContent>
  </Select>;
}

function AssetAvatar({ asset }: { asset: Pick<StagedAsset, "imageUrl" | "name" | "position"> }) {
  return <Avatar className="size-9 bg-muted">
    {asset.imageUrl ? <AvatarImage alt="" src={asset.imageUrl} /> : null}
    <AvatarFallback className="text-xs font-medium">{asset.position ?? "PK"}</AvatarFallback>
  </Avatar>;
}

function SuggestionRow({ asset, onAdd }: { asset: StagedAsset; onAdd: () => void }) {
  return <Button className="h-auto w-full justify-start gap-3 rounded-none px-4 py-2.5 text-left whitespace-normal" onClick={onAdd} variant="ghost">
    <AssetAvatar asset={asset} />
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5 font-medium"><span className="truncate">{asset.name}</span>{asset.position ? <PositionBadge position={asset.position} /> : null}</span>
      <span className="block truncate text-xs font-normal text-muted-foreground">{asset.detail}</span>
    </span>
    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{asset.value ? formatter.format(asset.value) : "—"}</span>
    <PlusIcon className="size-3.5 shrink-0 text-muted-foreground" />
  </Button>;
}

function StagedRow({ asset, onRemove }: { asset: StagedAsset; onRemove: () => void }) {
  return <div className="flex items-center gap-3 px-4 py-2.5">
    <AssetAvatar asset={asset} />
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-1.5 font-medium"><span className="truncate">{asset.name}</span>{asset.position ? <PositionBadge position={asset.position} /> : null}</span>
      <span className="block truncate text-xs text-muted-foreground">{asset.detail}</span>
    </span>
    <span className="tabular-nums text-sm">{asset.value ? formatter.format(asset.value) : "—"}</span>
    <Button aria-label={`Remove ${asset.name}`} className="size-7" onClick={onRemove} size="icon" variant="ghost"><XIcon className="size-4" /></Button>
  </div>;
}

function Side({ data, title, description, teamId, onTeamChange, assets, onAdd, onRemove }: {
  data: TradeLabData;
  title: string;
  description: string;
  teamId: string;
  onTeamChange: (value: string) => void;
  assets: StagedAsset[];
  onAdd: (asset: StagedAsset) => void;
  onRemove: (key: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [remote, setRemote] = React.useState<MarketPlayer[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState(false);
  const trimmed = query.trim();
  const roster = teamId === ANY_TEAM ? null : data.teams.find((team) => String(team.rosterId) === teamId) ?? null;
  const staged = new Set(assets.map((asset) => asset.key));
  // A redraft league has no tradeable picks, so every "or picks" prompt would be a dead end.
  const hasPicks = data.picks.length > 0;

  // Roster mode filters a list we already hold; hypothetical mode has to ask the server,
  // which is also the only path that can reach players nobody in the league rosters.
  React.useEffect(() => {
    if (roster || !trimmed) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/leagues/${data.league.id}/players?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const payload = await response.json() as { players?: MarketPlayer[] };
        setRemote(response.ok ? payload.players ?? [] : []);
        setSearchError(!response.ok);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRemote([]);
        setSearchError(true);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 150);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [data.league.id, roster, trimmed]);

  const playerSuggestions: StagedAsset[] = roster
    ? roster.players.filter((player) => player.name.toLowerCase().includes(trimmed.toLowerCase())).map((player) => playerAsset(player, player.value))
    : trimmed ? remote.map((entry) => playerAsset(entry.player, entry.value)) : [];
  const pickSuggestions = data.picks.filter((pick) => !trimmed || pick.label.toLowerCase().includes(trimmed.toLowerCase())).map(pickAsset);
  const suggestions = [...playerSuggestions, ...(trimmed ? pickSuggestions : pickSuggestions.slice(0, 3))].filter((asset) => !staged.has(asset.key)).slice(0, SUGGESTION_LIMIT);
  const total = sumValues(assets.map((asset) => asset.value));

  return <Card className="flex flex-col">
    <CardHeader>
      <div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2">{title === "You receive" ? <ArrowDownLeftIcon className="size-4 text-positive" /> : <ArrowUpRightIcon className="size-4 text-muted-foreground" />}{title}</CardTitle><Badge variant="secondary">{assets.length} {assets.length === 1 ? "asset" : "assets"}</Badge></div>
      <CardDescription>{description}</CardDescription>
      <div className="mt-3"><TeamSelect label={`${title} — team`} onChange={(next) => { onTeamChange(next); setQuery(""); setRemote([]); setSearchError(false); setIsSearching(false); }} teams={data.teams} value={teamId} /></div>
    </CardHeader>
    <CardContent className="flex flex-1 flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        {assets.length
          ? <div className="divide-y">{assets.map((asset) => <StagedRow asset={asset} key={asset.key} onRemove={() => onRemove(asset.key)} />)}</div>
          : <div className="flex min-h-28 flex-col items-center justify-center gap-1 px-4 py-5 text-center"><p className="text-sm font-medium">{title === "You receive" ? "What comes back?" : "What would you give up?"}</p><p className="text-xs text-muted-foreground">{hasPicks ? "Add players or draft picks from the list below." : "Add players from the list below."}</p></div>}
        {assets.length ? <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-sm">
          <span className="text-muted-foreground">{basisMeta(data.league.basis).hasMarket ? "Market value" : "Points above replacement"}</span>
          <span className="tabular-nums font-medium">{data.valuesReady ? formatter.format(total) : "—"}</span>
        </div> : null}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{roster ? "Available on this roster" : "Find an asset"}</span><span>{hasPicks ? "Players & picks" : "Players only"}</span></div>
      <div className="relative">
        <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label={`Add an asset to ${title}`} className="h-10 pl-8" onChange={(event) => { const value = event.target.value; setQuery(value); setRemote([]); setSearchError(false); setIsSearching(!roster && Boolean(value.trim())); }} placeholder={roster ? `Search ${roster.name}${hasPicks ? " and picks" : ""}...` : hasPicks ? "Search any player or pick..." : "Search any player..."} type="search" value={query} />
      </div>

      <div aria-busy={isSearching} className="max-h-80 overflow-y-auto rounded-lg border">
        {suggestions.length
          ? <div className="divide-y">{suggestions.map((asset) => <SuggestionRow asset={asset} key={asset.key} onAdd={() => { onAdd(asset); setQuery(""); }} />)}</div>
          : <p className="px-4 py-6 text-center text-sm text-muted-foreground">{isSearching ? "Searching..." : searchError ? "Player search is unavailable. Try another search or select a roster." : trimmed ? (hasPicks ? "No players or picks matched." : "No players matched.") : "Start typing to find a player."}</p>}
      </div>
    </CardContent>
  </Card>;
}

function Verdict({ basis, trade }: { basis: TradeLabData["league"]["basis"]; trade: RaTrade }) {
  const winnerLabel = trade.verdict.winner === null ? "Values are balanced" : trade.verdict.winner === "sideA" ? "Receive side leads" : "Send side leads";
  const total = trade.sideA.value + trade.sideB.value;
  const sharePercent = total ? Math.round((trade.sideA.value / total) * 100) : 50;

  return <Card>
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="mb-2 text-xs font-medium text-muted-foreground">Calculated comparison</p><CardTitle>{winnerLabel}</CardTitle><CardDescription>{trade.verdict.difference ? `${formatter.format(trade.verdict.difference)} ${basisMeta(basis).hasMarket ? "value" : "PPG+"} gap` : `Both sides carry the same ${basisMeta(basis).hasMarket ? "market value" : "projected production"}`}</CardDescription></div>
        <Badge aria-label={`Trade grade ${trade.verdict.grade}`} className={cn("text-base", gradeTone(trade.verdict.grade))} variant="outline">{trade.verdict.grade}</Badge>
      </div>
    </CardHeader>
    <CardContent className="flex flex-col gap-5">
      <div>
        <div className="flex justify-between gap-3 text-xs"><span>Receive <strong className="tabular-nums">{formatter.format(trade.sideA.value)}</strong></span><span>Send <strong className="tabular-nums">{formatter.format(trade.sideB.value)}</strong></span></div>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`You receive ${sharePercent}% of the traded value`}>
          <div className="bg-positive" style={{ width: `${sharePercent}%` }} />
          <div className="flex-1 bg-muted-foreground/30" />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{basisMeta(basis).hasMarket ? "Market values compare the assets in this deal. They do not account for your roster needs or competitive window." : "PPG+ compares projected points above replacement. Check your starting lineup before deciding."}</p>

      {trade.cliffWarnings.length ? <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground">Age and decline risk</p>
        {trade.cliffWarnings.map((warning) => <div className="rounded-xl border p-4" key={`${warning.sleeperId}-${warning.side}`}>
          <div className="flex flex-wrap items-center gap-2">
            <TriangleAlertIcon className="size-4 text-warning-foreground" />
            <span className="font-medium">{warning.name}</span>
            <PositionBadge position={warning.position} />
            <Badge variant="secondary">{warning.riskLevel} risk</Badge>
            <span className="text-xs text-muted-foreground">{warning.side === "acquiring" ? "You would acquire" : "You would send"}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{warning.summary}</p>
          {warning.factors.length ? <ul className="mt-2 flex flex-col gap-1">{warning.factors.map((factor) => <li className="text-xs text-muted-foreground" key={factor.factor}>· {factor.detail}</li>)}</ul> : null}
        </div>)}
      </div> : null}
    </CardContent>
  </Card>;
}

export function TradeCalculator({ data }: { data: TradeLabData }) {
  // Dynasty deals are graded on market value at RosterAudit; redraft deals are graded here on the
  // starting points each side gains. The page says which, so a verdict is never read in the wrong
  // currency, and the redraft board carries no picks to stage.
  const dynasty = data.league.basis === "dynasty";
  const myTeam = data.teams.find((team) => team.rosterId === data.myRosterId);
  const partnerDefault = data.teams.find((team) => team.rosterId !== data.myRosterId);
  const [receiveTeam, setReceiveTeam] = React.useState(partnerDefault ? String(partnerDefault.rosterId) : ANY_TEAM);
  const [sendTeam, setSendTeam] = React.useState(myTeam ? String(myTeam.rosterId) : ANY_TEAM);
  const [receive, setReceive] = React.useState<StagedAsset[]>([]);
  const [send, setSend] = React.useState<StagedAsset[]>([]);
  const [trade, setTrade] = React.useState<RaTrade | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const hasAssets = receive.length > 0 || send.length > 0;
  const ready = receive.length > 0 && send.length > 0;
  const add = (setter: React.Dispatch<React.SetStateAction<StagedAsset[]>>) => (asset: StagedAsset) => {
    setter((current) => current.some((entry) => entry.key === asset.key) ? current : [...current, asset]);
    setTrade(null);
    setError(null);
    setIsCalculating(false);
  };
  const remove = (setter: React.Dispatch<React.SetStateAction<StagedAsset[]>>) => (key: string) => {
    setter((current) => current.filter((entry) => entry.key !== key));
    setTrade(null);
    setError(null);
    setIsCalculating(false);
  };
  const swap = () => {
    setReceive(send); setSend(receive);
    setReceiveTeam(sendTeam); setSendTeam(receiveTeam);
    setTrade(null);
    setError(null);
    setIsCalculating(false);
  };
  const clear = () => { setReceive([]); setSend([]); setTrade(null); setError(null); setIsCalculating(false); };

  // Wait for a short pause after each edit, then cancel any obsolete request. This keeps the
  // calculator feeling live without spending the upstream rate limit on rapid add/remove clicks.
  React.useEffect(() => {
    if (!ready) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsCalculating(true);
      try {
        const response = await fetch("/api/roster-audit/trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leagueId: data.league.id, sideA: receive.map((asset) => asset.input), sideB: send.map((asset) => asset.input) }),
          signal: controller.signal,
        });
        const payload = await response.json() as CalculateResponse;
        if (!response.ok || !payload.trade) throw new Error(payload.error ?? "The trade could not be calculated.");
        setTrade(payload.trade);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setTrade(null);
        setError(requestError instanceof Error ? requestError.message : "The trade could not be calculated.");
      } finally {
        if (!controller.signal.aborted) setIsCalculating(false);
      }
    }, 350);

    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [data.league.id, ready, receive, send]);


  return <PageContainer className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeader description="Build both sides of a deal. Compare what comes back with what you give up." title="Trade Calculator" />
      <div className="flex items-center gap-2"><Badge variant="outline">{dynasty ? "Dynasty" : "Redraft"}</Badge><Badge variant="secondary">{data.league.superflex ? "Superflex" : "1QB"}</Badge></div>
    </div>

    {!data.valuesReady || !data.picksReady ? <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm"><InfoIcon className="mt-0.5 size-4 shrink-0 text-info-foreground" /><p className="text-muted-foreground">{!data.valuesReady ? dynasty ? "Live market values are unavailable. Staged totals are hidden; a graded result may still be available from RosterAudit." : "Projections are unavailable. Staged totals are hidden and a calculated result may appear balanced without usable projections." : "Draft pick values are unavailable. You can still compare players."}</p></div> : null}

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-w-0 items-start gap-4 md:grid-cols-2">
        <Side assets={receive} data={data} description="Choose the partner's outgoing assets" onAdd={add(setReceive)} onRemove={remove(setReceive)} onTeamChange={setReceiveTeam} teamId={receiveTeam} title="You receive" />
        <Side assets={send} data={data} description="Choose your outgoing assets" onAdd={add(setSend)} onRemove={remove(setSend)} onTeamChange={setSendTeam} teamId={sendTeam} title="You send" />
      </div>

      <aside aria-label="Trade comparison" className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6">
        <Card>
          <CardHeader><CardTitle>Deal overview</CardTitle><CardDescription>{data.league.name}</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b pb-3"><span className="text-muted-foreground">Receive / send</span><span className="font-medium tabular-nums">{receive.length} / {send.length} assets</span></div>
            <div aria-live="polite" className="flex items-start gap-2 text-sm text-muted-foreground">{isCalculating || ready && !trade && !error ? <LoaderCircleIcon className="mt-0.5 size-4 shrink-0 animate-spin" /> : <InfoIcon className="mt-0.5 size-4 shrink-0 text-info-foreground" />}<span>{isCalculating || ready && !trade && !error ? "Updating comparison…" : ready ? "Comparison updates as you edit." : "Add at least one asset to each side to calculate the deal."}</span></div>
            <div className="flex flex-wrap items-center gap-2"><Button disabled={!hasAssets} onClick={swap} size="sm" variant="outline"><ArrowUpDownIcon className="size-4" />Swap sides</Button><Button disabled={!hasAssets} onClick={clear} size="sm" variant="ghost">Clear all</Button></div>
          </CardContent>
        </Card>
        {trade ? <Verdict basis={data.league.basis} trade={trade} /> : error ? <Card><CardContent role="alert" className="flex items-start gap-3 text-sm"><TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" /><div><p className="font-medium">Comparison unavailable</p><p className="mt-1 text-muted-foreground">{error}</p><p className="mt-2 text-xs text-muted-foreground">Your staged assets are saved here. Edit either side to try again.</p></div></CardContent></Card> : <Card><CardHeader><CardTitle>How to compare</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Select each team’s roster, then add the assets they would send.</p><p>{dynasty ? "Draft picks use early, mid, or late slot estimates. Pick ownership is not verified." : "This redraft league compares projected production; future picks are excluded."}</p><p className="text-xs">Use “Any player” to explore a hypothetical deal.</p></CardContent></Card>}
      </aside>
    </div>
  </PageContainer>;
}
