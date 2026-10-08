"use client";

import { useState } from "react";
import { PlayerAdvanced, PlayerCareerTable } from "@/components/player/player-advanced";
import { PlayerHero } from "@/components/player/player-hero";
import { PlayerTradeMarketCard, RelatedList } from "@/components/player/player-market";
import { PlayerPercentiles } from "@/components/player/player-percentiles";
import { PlayerCliffRiskCard, PlayerCombineCard, PlayerContractCard, PlayerInjuryCard } from "@/components/player/player-profile-cards";
import { PlayerProjection } from "@/components/player/player-projection";
import { PlayerSnapTrend } from "@/components/player/player-usage";
import { PlayerWeeklyChart } from "@/components/player/player-weekly-chart";
import { TeamLink } from "@/components/team-link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerGameLog } from "@/components/player/player-game-log";
import { formatValue } from "@/lib/display";
import type { PlayerLeagueContext } from "@/lib/player-league-context";
import type { PlayerProfile } from "@/lib/roster-audit";

export function PlayerDetail({ profile, context, leagueId, isSuperflex, username }: { profile: PlayerProfile; context: PlayerLeagueContext; leagueId: string; isSuperflex: boolean; username?: string }) {
  const [tab, setTab] = useState("summary");
  const scores = profile.weekly.flatMap(line => line.pointsPpr == null ? [] : [line.pointsPpr]);
  const ppgMetric = profile.rankMetrics.find(metric => /points.*game|ppg|fantasy_points_ppr_avg/i.test(`${metric.key} ${metric.label}`));
  const ppg = ppgMetric?.value ?? (scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null);
  const overall = isSuperflex ? profile.value.rankOverallSf : profile.value.rankOverall1qb;
  const position = isSuperflex ? profile.value.rankPositionSf : profile.value.rankPosition1qb;

  const hasHistory = profile.career.length || profile.injury || profile.combine || profile.tradeMarket?.trades.length;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PlayerHero profile={profile} leagueId={leagueId} username={username} />
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
        <TabsList variant="line" className="mx-5 w-auto shrink-0 justify-between border-b p-0 group-data-horizontal/tabs:h-11 md:mx-7" aria-label="Player details">
          {[["summary", "Summary"], ["game-log", "Game log"], ["team", "Team"], ["history", "History"]].map(([value, label]) => <TabsTrigger key={value} value={value} className="rounded-none px-2 text-xs after:bottom-0 md:text-sm">{label}</TabsTrigger>)}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(24px,env(safe-area-inset-bottom))] md:px-7">
          <TabsContent value="summary">
            <dl className="grid grid-cols-3 gap-4 py-5">
              <div><dt className="text-[11px] text-muted-foreground">Dynasty rank</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{position == null ? "—" : `#${position}`} <span className="text-xs font-normal text-muted-foreground">{profile.player.position}</span></dd><dd className="text-xs text-muted-foreground">{overall == null ? "—" : `#${overall}`} overall · {isSuperflex ? "SF" : "1QB"}</dd></div>
              <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">In your league</dt><dd className="mt-1 text-sm font-medium">{context.owner ? context.owner.isMine ? "Your team" : "Rostered" : "Free agent"}</dd><dd className="mt-1 truncate text-xs text-muted-foreground">{context.owner ? <TeamLink leagueId={leagueId} rosterId={context.owner.rosterId} username={username}>{context.owner.teamName}</TeamLink> : "Available"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Pts / game</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{ppg?.toFixed(2) ?? "—"}</dd><dd className="text-xs text-muted-foreground">PPR · {profile.rankSeason ?? profile.season ?? "Season"}</dd></div>
            </dl>
            <section className="flex items-center justify-between gap-4 border-t py-5">
              <div><h2 className="text-xs text-muted-foreground">Dynasty value · {isSuperflex ? "SF" : "1QB"}</h2><p className="mt-1 text-2xl font-semibold tabular-nums">{formatValue(isSuperflex ? profile.value.valueSf : profile.value.value1qb)}</p></div>
              <dl className="flex gap-5">{[["7d", profile.value.trend7d], ["30d", profile.value.trend30d]].map(([label, trend]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1 text-sm font-medium tabular-nums ${Number(trend) > 0 ? "text-positive" : Number(trend) < 0 ? "text-negative" : "text-muted-foreground"}`}>{Number(trend) > 0 ? "+" : ""}{formatValue(Number(trend))}</dd></div>)}</dl>
            </section>
            <PlayerPercentiles metrics={profile.rankMetrics} position={profile.player.position} season={profile.rankSeason ?? profile.season} />
            <PlayerProjection curve={profile.projectionCurve} outcome={profile.outcome} ppg={profile.projectedPpg} ppgPpr={profile.projectedPpgPpr} summary={null} />
            <PlayerSnapTrend avgSnapPct={profile.avgSnapPct} snaps={profile.snapsWeekly} />
            <PlayerAdvanced advanced={profile.advanced} />
            <PlayerCliffRiskCard cliffRisk={profile.cliffRisk} />
            {profile.related ? <><RelatedList title="Similar value" description="" players={profile.related.similarValue} leagueId={leagueId} username={username} /><RelatedList title="Same tier" description="" players={profile.related.sameTier} leagueId={leagueId} username={username} /></> : null}
          </TabsContent>
          <TabsContent value="game-log">
            {profile.weekly.length ? <>
              <PlayerGameLog profile={profile} /><PlayerWeeklyChart season={profile.season} weekly={profile.weekly} />
            </> : <p className="py-10 text-center text-sm text-muted-foreground">No games recorded.</p>}
          </TabsContent>
          <TabsContent value="team">
            <section className="py-5"><h2 className="font-heading text-base font-semibold">{profile.player.team ?? "Free agent"}</h2><dl className="mt-4 space-y-3"><div className="flex justify-between gap-4"><dt className="text-sm text-muted-foreground">Fantasy team</dt><dd className="text-right text-sm font-medium">{context.owner ? <TeamLink leagueId={leagueId} rosterId={context.owner.rosterId} username={username}>{context.owner.teamName}</TeamLink> : "Free agent"}</dd></div>{context.owner ? <div className="flex justify-between"><dt className="text-sm text-muted-foreground">Lineup</dt><dd className="text-sm">{context.starterSlots.length ? "Starter" : "Bench"}</dd></div> : null}</dl></section>
            {profile.related?.teammates.length ? <RelatedList title="NFL teammates" description="" players={profile.related.teammates} leagueId={leagueId} username={username} /> : null}
            <PlayerContractCard contract={profile.contract} />
          </TabsContent>
          <TabsContent value="history">
            <PlayerCareerTable career={profile.career} /><PlayerTradeMarketCard market={profile.tradeMarket} /><PlayerInjuryCard injury={profile.injury} /><PlayerCombineCard combine={profile.combine} />
            {!hasHistory ? <p className="py-10 text-center text-sm text-muted-foreground">No player history available.</p> : null}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
