import { PlayerHero } from "sleeper-fantasy-dashboard";
import { CMC, CMC_CONTEXT, D_LEAGUE_ID, PUKA, PUKA_CONTEXT, PUKA_MINE, ROOKIE } from "./_fixtures/d-player";
import { Stage } from "./_fixtures/stage";

export const RosteredSuperflex = () => <Stage><PlayerHero context={PUKA_CONTEXT} isSuperflex leagueId={D_LEAGUE_ID} profile={PUKA} /></Stage>;

export const OnYourTeam1qb = () => <Stage><PlayerHero context={PUKA_MINE} isSuperflex={false} leagueId={D_LEAGUE_ID} profile={PUKA} /></Stage>;

export const FallingFreeAgent = () => <Stage><PlayerHero context={CMC_CONTEXT} isSuperflex leagueId={D_LEAGUE_ID} profile={CMC} /></Stage>;

export const Rookie = () => <Stage><PlayerHero context={{ owner: { rosterId: 1, teamName: "Bijan Mustard", manager: "sarahk", isMine: false }, positionMates: [], starterSlots: [] }} isSuperflex leagueId={D_LEAGUE_ID} profile={ROOKIE} /></Stage>;
