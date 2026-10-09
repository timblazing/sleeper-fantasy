"use client";

import * as React from "react";
import { BinocularsIcon, CircleAlertIcon, CrosshairIcon, GlobeIcon, HandshakeIcon, LightbulbIcon, TrendingUpIcon, TriangleAlertIcon, UserSearchIcon } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ValueBasis } from "@/lib/value-basis";
import { PositionBadge } from "@/components/position-badge";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ResponsiveTabs } from "@/components/responsive-tabs";
import type { InsightGroup, ManagerProfile, RoomNeed, ScoutInsight, ScoutingReport, SignalStrength, Window } from "@/lib/scouting-report";
import { cn, withUsername } from "@/lib/utils";

const avatarUrl = (id: string) => `https://sleepercdn.com/avatars/thumbs/${id}`;
const initials = (name: string) => name.slice(0, 2).toUpperCase();

const WINDOW_VARIANT: Record<Window, "success" | "info" | "outline"> = {
  Contender: "success", Rebuilding: "info", Fringe: "outline",
};

const TONE_CHIP: Record<ScoutInsight["tone"], string> = {
  positive: "bg-positive/10 text-positive",
  warning: "bg-warning/10 text-warning-foreground",
  critical: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

/** The tag on an insight card takes the tone's colour, matching the tinted glyph. */
const TONE_TEXT: Record<ScoutInsight["tone"], string> = {
  positive: "text-positive",
  warning: "text-warning-foreground",
  critical: "text-destructive",
  neutral: "text-muted-foreground",
};

const GROUPS: { id: InsightGroup; heading: string; icon: React.ComponentType<{ size?: string | number }> }[] = [
  { id: "needs", heading: "What they need", icon: CrosshairIcon },
  { id: "trades", heading: "How they trade", icon: HandshakeIcon },
  { id: "cross-league", heading: "Cross-league intel", icon: GlobeIcon },
  { id: "edge", heading: "Your edge", icon: LightbulbIcon },
];

const STRENGTH_LABEL: Record<SignalStrength, string> = { strong: "Strong signal", moderate: "Moderate signal", weak: "Limited data" };

const STRENGTH_VARIANT: Record<SignalStrength, "success" | "warning" | "outline"> = {
  strong: "success", moderate: "warning", weak: "outline",
};

function ToneIcon({ tone }: { tone: ScoutInsight["tone"] }) {
  const Icon = tone === "positive" ? TrendingUpIcon : tone === "critical" ? CircleAlertIcon : tone === "warning" ? TriangleAlertIcon : LightbulbIcon;
  return <Icon size="14" aria-hidden="true" />;
}

/**
 * The leverage score, drawn as a numeral in a tinted well.
 *
 * Deliberately not a progress bar: the number is ordinal guidance ("work this one before that
 * one"), not a precise quantity, and a bar invites reading 52 as meaningfully more than 49.
 */
function LeverageMark({ score, muted, size = "sm" }: { score: number; muted: boolean; size?: "sm" | "lg" }) {
  const tint = muted || score === 0 ? "bg-muted text-muted-foreground" : score >= 50 ? "bg-positive/12 text-positive" : "bg-warning/12 text-warning-foreground";
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-lg font-medium tabular-nums", size === "lg" ? "size-14 text-2xl" : "size-11 text-lg", tint)}
      title={`Leverage ${score} of 100`}
    >
      {score}
    </span>
  );
}

function InsightCard({ insight }: { insight: ScoutInsight }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-muted-foreground/25">
      <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", TONE_CHIP[insight.tone])}><ToneIcon tone={insight.tone} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("text-xs font-medium", TONE_TEXT[insight.tone])}>{insight.label}</span>
          {insight.thisLeague ? null : <Badge className="text-xs" variant="outline">Cross-league</Badge>}
          <Badge variant={STRENGTH_VARIANT[insight.strength]}>{STRENGTH_LABEL[insight.strength]}</Badge>
        </div>
        <p className="mt-1 text-sm font-medium">{insight.title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{insight.detail}</p>
      </div>
    </div>
  );
}

/** One position room, drawn as a rank pill — the shorthand for "this is where they shop". */
function RoomPills({ label, rooms, teams, tone }: { label: string; rooms: RoomNeed[]; teams: number; tone: "need" | "surplus" }) {
  if (!rooms.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {rooms.map((room) => (
        <span
          key={room.position}
          className={cn(
            "rounded-md px-1.5 py-0.5 tabular-nums text-xs font-medium",
            tone === "need" ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive",
          )}
          title={`${room.position} ranked #${room.rank} of ${teams}`}
        >
          {room.position} #{room.rank}
        </span>
      ))}
    </div>
  );
}

/** Recorded activity supplies context for the recommendations without implying future behavior. */
function ManagerActivity({ profile, basis }: { profile: ManagerProfile; basis: ValueBasis }) {
  const tendencies = profile.tendencies;
  const peak = Math.max(...tendencies.activityByDay, 1);
  const activity = tendencies.activityByDay.reduce((sum, count) => sum + count, 0);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const draftTotal = profile.draftTendencies.reduce((sum, entry) => sum + entry.picks, 0);

  return (
    <section className="flex flex-col gap-4 border-y py-4">
      <div className="grid grid-cols-3 gap-3">
        <div><p className="text-xs text-muted-foreground">Completed trades</p><p className="mt-1 text-xl font-semibold tabular-nums">{tendencies.trades}</p><p className="text-xs text-muted-foreground">{tendencies.style} · #{tendencies.tradeRank} in league</p></div>
        <div><p className="text-xs text-muted-foreground">Trades / season</p><p className="mt-1 text-xl font-semibold tabular-nums">{tendencies.tradesPerYear.toLocaleString("en-US", { maximumFractionDigits: 1 })}</p><p className="text-xs text-muted-foreground">{tendencies.seasonsScanned} seasons scanned</p></div>
        <div><p className="text-xs text-muted-foreground">{basis === "dynasty" ? "Net pick flow" : "Waiver claims"}</p><p className={cn("mt-1 text-xl font-semibold tabular-nums", tendencies.netPickFlow > 0 && "text-positive")}>{basis === "dynasty" ? `${tendencies.netPickFlow > 0 ? "+" : ""}${tendencies.netPickFlow}` : tendencies.waiverClaims}</p><p className="text-xs text-muted-foreground">{basis === "dynasty" ? "Acquired minus sent" : "Across scanned seasons"}</p></div>
      </div>
      {activity > 0 || draftTotal > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {activity > 0 ? (
            <div>
              <h3 className="text-xs font-medium">Weekly activity</h3>
              <p className="mt-1 text-xs text-muted-foreground">{activity} non-trade moves · peak {tendencies.busiestDay ?? "day unavailable"}</p>
              <div className="mt-3 flex h-20 items-end gap-2">
                {days.map((day, index) => (
                  <div key={day} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${day}: ${tendencies.activityByDay[index] ?? 0} moves`}>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{tendencies.activityByDay[index] ?? 0}</span>
                    <div aria-hidden="true" className="w-full max-w-9 rounded-t-sm bg-info/60" style={{ height: `${(tendencies.activityByDay[index] ?? 0) / peak * 42}px` }} />
                    <span className="text-[10px] text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {draftTotal > 0 ? (
            <div>
              <h3 className="text-xs font-medium">Draft preferences</h3>
              <p className="mt-1 text-xs text-muted-foreground">{draftTotal} recorded picks by position</p>
              <div className="mt-3 flex flex-col gap-2">
                {profile.draftTendencies.map((entry) => (
                  <div key={entry.position} className="grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-2">
                    <PositionBadge position={entry.position} />
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div aria-hidden="true" className="h-full rounded-full bg-info/60" style={{ width: `${entry.picks / draftTotal * 100}%` }} /></div>
                    <span className="text-right text-xs text-muted-foreground tabular-nums">{entry.picks}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** One selected manager, with immediate fit beside recorded behavior. */
function Dossier({ profile, report }: { profile: ManagerProfile; report: ScoutingReport }) {
  const dynasty = report.basis === "dynasty";
  const grouped = GROUPS.map(group => ({ ...group, items: profile.insights.filter(insight => insight.group === group.id) })).filter(group => group.items.length);
  const record = profile.record;
  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-12"><AvatarImage src={profile.avatar ? avatarUrl(profile.avatar) : undefined} alt="" /><AvatarFallback>{initials(profile.manager)}</AvatarFallback></Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-heading text-xl font-semibold">{profile.name}</h2>
            {dynasty && report.valuesReady && profile.window ? <Badge variant={WINDOW_VARIANT[profile.window]}>{profile.window}</Badge> : null}
            {profile.isUser ? <Badge variant="secondary">Your team</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">@{profile.manager} · {record.wins}-{record.losses}{record.ties ? `-${record.ties}` : ""} · {report.valuesReady ? `#${profile.valueRank} of ${profile.teams} in ${dynasty ? "dynasty value" : "projected roster PPG+"}` : "Roster values unavailable"}</p>
        </div>
      </div>
      {report.valuesReady && report.userRosterId && !profile.isUser ? <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Trade fit</span><LeverageMark muted={false} score={profile.leverage} /><Button nativeButton={false} size="sm" variant="outline" render={<Link href={withUsername(`/${report.league.id}/trade`, report.username)} />}>Explore a deal</Button></div> : null}
    </header>
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium">{profile.isUser ? "Your roster outlook" : "Trade angle"}</h3>
        {report.valuesReady ? <>
          {profile.play ? <div className="rounded-lg border bg-muted/30 p-4"><p className="mb-1 text-xs font-medium text-positive">{dynasty ? "Suggested approach" : "Scoring fit"}</p><p className="text-sm leading-relaxed">{profile.play}</p></div> : <p className="text-sm text-muted-foreground">{profile.isUser ? "Compare your position strengths with the other managers to find a complementary deal." : "No clear complementary trade identified. Compare both sides before making an offer."}</p>}
          <RoomPills label={dynasty ? "Needs" : "Weaker scoring rooms"} rooms={profile.needs} teams={profile.teams} tone="need" />
          <RoomPills label={dynasty ? "Depth" : "Stronger scoring rooms"} rooms={profile.surpluses} teams={profile.teams} tone="surplus" />
          <p className="text-xs leading-relaxed text-muted-foreground">{dynasty ? "Position ranks compare dynasty market value in this league." : "Position ranks compare projected points above replacement in this league’s lineup format. Use them to identify complementary strengths for a deal."}</p>
        </> : <p className="text-sm text-muted-foreground">Current roster values are unavailable. Position needs and trade-fit suggestions will return when the feed recovers.</p>}
      </section>
      <ManagerActivity profile={profile} basis={report.basis} />
    </div>
    <div className="grid items-start gap-6 md:grid-cols-2">{grouped.map(group => <section key={group.id}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><group.icon size="14" aria-hidden="true" />{group.heading}</h3>
      <div className="flex flex-col gap-2">{group.items.map(insight => <InsightCard insight={insight} key={insight.id} />)}</div>
    </section>)}</div>
  </div>;
}

/** The filter chips. Each is a predicate over the profile list rather than a stored view. */
const FILTERS = [
  { id: "all", label: "All", match: () => true },
  { id: "needs-qb", label: "Needs QB", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "QB") },
  { id: "needs-rb", label: "Needs RB", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "RB") },
  { id: "needs-wr", label: "Needs WR", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "WR") },
  { id: "needs-te", label: "Needs TE", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "TE") },
  { id: "has-picks", label: "Pick accumulators", match: (profile: ManagerProfile) => profile.tendencies.netPickFlow > 0 },
  { id: "rebuilders", label: "Rebuilders", match: (profile: ManagerProfile) => profile.window === "Rebuilding" },
  { id: "contenders", label: "Contenders", match: (profile: ManagerProfile) => profile.window === "Contender" },
  { id: "active", label: "Active traders", match: (profile: ManagerProfile) => profile.tendencies.style === "Active" || profile.tendencies.style === "Hyperactive" },
] as const;

export function ScoutingReportView({ report }: { report: ScoutingReport }) {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const dynasty = report.basis === "dynasty";
  const filters = FILTERS.filter(entry => (dynasty || !["has-picks", "rebuilders", "contenders"].includes(entry.id)) && (report.valuesReady || ["all", "active"].includes(entry.id)));
  const active = filters.find(entry => entry.id === filter) ?? filters[0];
  const visible = report.profiles.filter(profile => active.match(profile) && `${profile.name} ${profile.manager}`.toLowerCase().includes(search.toLowerCase()));
  const selected = visible.find(profile => profile.rosterId === selectedId) ?? visible.find(profile => !profile.isUser) ?? visible[0] ?? null;
  return <PageContainer className="flex flex-col gap-5">
    <PageHeader title="Scouting report" description={dynasty ? report.valuesReady ? report.marketSummary : "Manager behavior and league history. Current roster values are unavailable." : "Find a scoring fit for this season. Compare position needs, trade habits, and recorded manager activity."} />
    {!report.userRosterId ? <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm text-muted-foreground"><UserSearchIcon className="size-4 shrink-0" /><p>Connect your Sleeper account for personalized trade fits and recommendations.</p></div> : null}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ResponsiveTabs label="Filter managers" mode="filter" value={active.id} onValueChange={setFilter} items={filters.map(entry => ({ value: entry.id, label: entry.label }))} />
      <Input aria-label="Search managers" placeholder="Search teams or managers…" value={search} onChange={event => setSearch(event.target.value)} className="w-full sm:max-w-64" />
    </div>
    <section className="flex flex-col gap-3" aria-label="Choose a manager">
      <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-medium">Choose a manager</h2><span className="text-xs text-muted-foreground">{visible.length} teams · {report.seasonsScanned} {report.seasonsScanned === 1 ? "season" : "seasons"} of history</span></div>
      <p className="text-xs text-muted-foreground sm:hidden">Swipe to browse teams.</p>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">{visible.map(profile => <Button key={profile.rosterId} variant={selected?.rosterId === profile.rosterId ? "default" : "outline"} className="h-auto min-h-10 max-w-full shrink-0 justify-start gap-2 px-3 py-2" aria-pressed={selected?.rosterId === profile.rosterId} aria-controls="manager-report" onClick={() => setSelectedId(profile.rosterId)}>
        <Avatar aria-hidden="true" className="size-6 shrink-0"><AvatarImage src={profile.avatar ? avatarUrl(profile.avatar) : undefined} alt="" /><AvatarFallback className="text-[10px]">{initials(profile.manager)}</AvatarFallback></Avatar><span className="truncate">{profile.name}</span>{profile.isUser ? <span className="text-[10px] opacity-70">You</span> : null}
      </Button>)}</div>
    </section>
    {selected ? <Card id="manager-report" className="gap-0 py-0"><CardContent className="p-4 md:p-6"><Dossier profile={selected} report={report} /></CardContent></Card> : <Empty className="min-h-48 border"><EmptyHeader><EmptyMedia variant="icon"><BinocularsIcon /></EmptyMedia><EmptyTitle>No managers match</EmptyTitle><EmptyDescription>Try another filter or search.</EmptyDescription></EmptyHeader></Empty>}
    {!report.historyReady ? <p className="text-xs text-muted-foreground">RosterAudit league history is unavailable, so lineup efficiency and rivalry records are hidden. Trade and waiver tendencies still come from Sleeper.</p> : null}
  </PageContainer>;
}
