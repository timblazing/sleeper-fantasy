"use client";

import { useState } from "react";
import { PlayerIdentity } from "@/components/player-identity";
import { Card, CardContent } from "@/components/ui/card";
import { PanelHeader, PanelLink } from "@/components/panel-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { DashboardPulse } from "@/lib/dashboard-pulse";
import { cn, withUsername } from "@/lib/utils";

const POSITIONS = ["All", "QB", "RB", "WR", "TE"];

export function DashboardWaivers({ pulse, leagueId, username, className }: { pulse?: DashboardPulse | null; leagueId: string; username?: string; className?: string }) {
  const [position, setPosition] = useState("All");
  const weekly = pulse?.waiverBasis === "weekly";
  const description = weekly ? `Week ${pulse.week} projections` : pulse?.waiverBasis === "dynasty" ? "Ranked by dynasty market value" : "Ranked by projected PPG";
  const list = (tab: string) => {
    const candidates = pulse?.waivers.filter(entry => tab === "All" || entry.player.position === tab).slice(0, 5) ?? [];
    return candidates.length ? <ol className="divide-y">{candidates.map(({ player, score }) => <li key={player.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <PlayerIdentity className="flex-1" name={player.name} sleeperId={player.id} position={player.position} team={player.team} metadata={`${player.team}${player.injuryStatus ? ` · ${player.injuryStatus}` : ""}`} href={withUsername(`/${leagueId}/players/${player.id}`, username)} />
      <div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums">{score.toLocaleString("en-US", { maximumFractionDigits: pulse?.waiverBasis === "dynasty" ? 0 : 1 })}</p><p className="text-xs text-muted-foreground">{weekly ? "proj pts" : pulse?.waiverBasis === "dynasty" ? "value" : "PPG"}</p></div>
    </li>)}</ol> : <p className="py-6 text-sm text-muted-foreground">{pulse?.waiverReady ? `No ranked, active ${tab === "All" ? "free agents" : tab + " free agents"} found in this league.` : "Player rankings are unavailable. Reload to try again."}</p>;
  };
  return <Card className={className}>
    <PanelHeader title="Waiver watch" description={pulse?.waiverReady ? description : "Player rankings are temporarily unavailable"} actions={<PanelLink href={withUsername(`/${leagueId}/players`, username)} label="Browse all players" />} />
    <CardContent className="flex flex-1 flex-col">
      <Tabs value={position} onValueChange={setPosition}><TabsList className="w-full" aria-label="Waiver position">{POSITIONS.map(value => <TabsTrigger className="flex-1" key={value} value={value}>{value}</TabsTrigger>)}</TabsList>
      {/* Every tab's list is stacked in one grid cell and only the active one is visible, so the card
          keeps the height of its longest list and the column doesn't reflow when switching tabs. */}
      <TabsContent value={position} className="grid pt-4">
        {POSITIONS.map(tab => <div key={tab} className={cn("[grid-area:1/1]", tab !== position && "invisible")} inert={tab !== position} aria-hidden={tab !== position || undefined}>{list(tab)}</div>)}
      </TabsContent></Tabs>
    </CardContent>
  </Card>;
}
