"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Crosshair } from "lucide-react";
import { PlayerIdentity } from "@/components/player-identity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { DashboardPulse } from "@/lib/dashboard-pulse";
import { withUsername } from "@/lib/utils";

export function DashboardWaivers({ pulse, leagueId, username }: { pulse?: DashboardPulse | null; leagueId: string; username?: string }) {
  const [position, setPosition] = useState("All");
  const candidates = pulse?.waivers.filter(entry => position === "All" || entry.player.position === position).slice(0, 5) ?? [];
  const weekly = pulse?.waiverBasis === "weekly";
  const description = weekly ? `Week ${pulse.week} projections · your league scoring` : pulse?.waiverBasis === "dynasty" ? "Ranked by dynasty market value" : "Ranked by projected PPG above replacement";
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><Crosshair className="size-4 text-info-foreground" aria-hidden />Waiver watch</CardTitle><CardDescription>{pulse?.waiverReady ? description : "Player rankings are temporarily unavailable"}</CardDescription><CardAction><Link href={withUsername(`/${leagueId}/players`, username)} aria-label="Browse all players" className="flex size-8 items-center justify-center rounded-md hover:bg-muted"><ArrowUpRight className="size-4" /></Link></CardAction></CardHeader>
    <CardContent>
      <Tabs value={position} onValueChange={setPosition} className="mb-4"><TabsList className="w-full" aria-label="Waiver position">{["All", "QB", "RB", "WR", "TE"].map(value => <TabsTrigger className="flex-1" key={value} value={value}>{value}</TabsTrigger>)}</TabsList>
      <TabsContent value={position} className="pt-4">
      {candidates.length ? <ol className="divide-y">{candidates.map(({ player, score }) => <li key={player.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <PlayerIdentity className="flex-1" name={player.name} sleeperId={player.id} position={player.position} team={player.team} metadata={`${player.team}${player.injuryStatus ? ` · ${player.injuryStatus}` : ""}`} href={withUsername(`/${leagueId}/players/${player.id}`, username)} />
        <div className="shrink-0 text-right"><p className="font-semibold tabular-nums">{score.toLocaleString("en-US", { maximumFractionDigits: pulse?.waiverBasis === "dynasty" ? 0 : 1 })}</p><p className="text-[11px] text-muted-foreground">{weekly ? "proj pts" : pulse?.waiverBasis === "dynasty" ? "value" : "PPG+"}</p></div>
      </li>)}</ol> : <p className="py-6 text-sm text-muted-foreground">{pulse?.waiverReady ? `No ranked, active ${position === "All" ? "free agents" : position + " free agents"} found in this league.` : "Player rankings are unavailable. Reload to try again."}</p>}
      </TabsContent></Tabs>
      <p className="mt-4 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">Unrostered in your league. Check waiver rules and game status in Sleeper before adding.</p>
    </CardContent>
  </Card>;
}
