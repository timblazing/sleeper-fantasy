"use client";

import * as React from "react";
import { BinocularsIcon, CircleAlertIcon, CrosshairIcon, GlobeIcon, HandshakeIcon, LightbulbIcon, TrendingUpIcon, TriangleAlertIcon, UserSearchIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ResponsiveTabs } from "@/components/responsive-tabs";
import { Disclosure } from "@/components/ui/disclosure";
import type { InsightGroup, ManagerProfile, RoomNeed, ScoutInsight, ScoutingReport, SignalStrength, Window } from "@/lib/scouting-report";
import { cn } from "@/lib/utils";

const avatarUrl = (id: string) => `https://sleepercdn.com/avatars/thumbs/${id}`;
const initials = (name: string) => name.slice(0, 2).toUpperCase();

/**
 * Leverage tiers.
 *
 * The rail is grouped rather than sorted flat so the page answers "who do I call first" at a
 * glance: a 12-team league is too many dossiers to rank by eye, but three buckets are not.
 */
const TIERS = [
  { id: "high", heading: "Worth exploring", hint: "Situational opportunities", dot: "bg-positive" },
  { id: "low", heading: "Low leverage", hint: "Engage only on mutual benefit", dot: "bg-muted-foreground/50" },
  { id: "self", heading: "Self scout", hint: "How the league reads you", dot: "bg-muted-foreground" },
] as const;

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
            tone === "need" ? "bg-destructive/10 text-destructive" : "bg-positive/10 text-positive",
          )}
          title={`${room.position} ranked #${room.rank} of ${teams}`}
        >
          {room.position} #{room.rank}
        </span>
      ))}
    </div>
  );
}

/**
 * The angle on a rail card, as two or three words.
 *
 * The full recommendation lives in the dossier. In the rail it would truncate — and because
 * several managers share the same opening ("Sell RB depth into their critical need…"), the
 * clipped sentences read as identical rows. The verb plus the hole pills below it are what
 * actually differ, so the rail carries those instead.
 */
function angleFor(profile: ManagerProfile): string {
  if (profile.isUser) return "Self scout";
  if (profile.tendencies.trades === 0) return "Won't answer";
  const play = profile.play ?? "";
  if (play.startsWith("Sell")) return `Sell them ${play.split(" ")[1]}`;
  if (play.startsWith("Buy")) return `Buy their ${play.split(" ")[1]}`;
  if (profile.window === "Rebuilding") return "Open for business";
  if (profile.window === "Contender") return "Win-now buyer";
  return "No clean fit";
}

/** Shared noninteractive identity for the desktop selector and native mobile summary. */
function ManagerIdentity({ profile }: { profile: ManagerProfile }) {
  return <div className="flex min-w-0 items-center gap-3">
      <LeverageMark muted={profile.isUser} score={profile.leverage} />
      <Avatar className="size-8 max-sm:hidden">
        <AvatarImage src={profile.avatar ? avatarUrl(profile.avatar) : undefined} alt="" />
        <AvatarFallback className="text-xs">{initials(profile.manager)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{profile.manager}</span>
          <Badge variant={WINDOW_VARIANT[profile.window]}>{profile.window}</Badge>
          {profile.isUser ? <Badge className="text-xs" variant="secondary">You</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{angleFor(profile)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {profile.needs.slice(0, 3).map((room) => (
            <span
              className="rounded-md bg-destructive/10 px-1.5 py-0.5 tabular-nums text-xs font-medium text-destructive"
              key={room.position}
              title={`${room.position} ranked #${room.rank} of ${profile.teams}`}
            >
              {room.position} #{room.rank}
            </span>
          ))}
        </div>
      </div>
  </div>;
}

function ManagerCard({ profile, selected, onSelect }: { profile: ManagerProfile; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" aria-current={selected ? "true" : undefined} onClick={onSelect}
      className={cn("hidden w-full rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring lg:block", selected && "border-positive/50 bg-positive/5")}>
      <ManagerIdentity profile={profile} />
    </button>
  );
}

/** The right-hand dossier for whichever manager is selected. */
function Dossier({ profile, showHeader = true }: { profile: ManagerProfile; showHeader?: boolean }) {
  const grouped = GROUPS.map((group) => ({ ...group, items: profile.insights.filter((insight) => insight.group === group.id) })).filter((group) => group.items.length > 0);
  const tend = profile.tendencies;
  const record = profile.record;

  return (
    <div className="flex flex-col gap-5">
      {showHeader ? (
        <header className="flex flex-wrap items-center gap-3 border-b pb-4">
          <LeverageMark muted={profile.isUser} score={profile.leverage} size="lg" />
          <Avatar className="size-10">
            <AvatarImage src={profile.avatar ? avatarUrl(profile.avatar) : undefined} alt="" />
            <AvatarFallback>{initials(profile.manager)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium tracking-tight">{profile.manager}</h2>
              <Badge variant={WINDOW_VARIANT[profile.window]}>{profile.window}</Badge>
              {tend.netPickFlow > 0 ? <Badge variant="outline">+{tend.netPickFlow} picks</Badge> : null}
              {profile.isUser ? <Badge variant="secondary">You</Badge> : null}
            </div>
            <p className="mt-0.5 tabular-nums text-xs text-muted-foreground">
              {record.wins}-{record.losses}{record.ties ? `-${record.ties}` : ""} · #{profile.valueRank} of {profile.teams} in value
              {profile.career ? ` · ${profile.career.championships} title${profile.career.championships === 1 ? "" : "s"} in ${profile.career.seasons} seasons` : ""}
            </p>
          </div>
        </header>
      ) : null}

      {profile.play ? (
        <div className="flex items-start gap-3 rounded-lg border border-positive/30 bg-positive/5 p-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-positive" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-positive">Your play</p>
            <p className="mt-0.5 font-medium">{profile.play}</p>
          </div>
        </div>
      ) : null}

      {profile.needs.length || profile.surpluses.length ? (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
          <RoomPills label="Holes" rooms={profile.needs.slice(0, 3)} teams={profile.teams} tone="need" />
          <RoomPills label="Depth" rooms={profile.surpluses.slice(0, 3)} teams={profile.teams} tone="surplus" />
        </div>
      ) : null}

      {grouped.map((group) => (
        <section key={group.id}>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <group.icon size="12" aria-hidden="true" />
            {group.heading}
          </h3>
          <div className="flex flex-col gap-2">
            {group.items.map((insight) => <InsightCard insight={insight} key={insight.id} />)}
          </div>
        </section>
      ))}

    </div>
  );
}

/** The filter chips. Each is a predicate over the profile list rather than a stored view. */
const FILTERS = [
  { id: "all", label: "All", match: () => true },
  { id: "needs-qb", label: "Needs QB", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "QB") },
  { id: "needs-rb", label: "Needs RB", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "RB") },
  { id: "needs-wr", label: "Needs WR", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "WR") },
  { id: "needs-te", label: "Needs TE", match: (profile: ManagerProfile) => profile.needs.some((room) => room.position === "TE") },
  { id: "has-picks", label: "Has picks", match: (profile: ManagerProfile) => profile.tendencies.netPickFlow > 0 },
  { id: "rebuilders", label: "Rebuilders", match: (profile: ManagerProfile) => profile.window === "Rebuilding" },
  { id: "contenders", label: "Contenders", match: (profile: ManagerProfile) => profile.window === "Contender" },
  { id: "active", label: "Active traders", match: (profile: ManagerProfile) => profile.tendencies.style === "Active" || profile.tendencies.style === "Hyperactive" },
] as const;

export function ScoutingReportView({ report }: { report: ScoutingReport }) {
  const [filter, setFilter] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const active = FILTERS.find((entry) => entry.id === filter) ?? FILTERS[0];

  // The self scout always shows: it is the mirror the rest of the page is read against, and
  // hiding it behind a "Needs RB" filter would make the page look like it lost a row.
  const visible = report.profiles.filter((profile) => profile.isUser || active.match(profile));
  const tiers = {
    high: visible.filter((profile) => !profile.isUser && profile.leverage >= 40),
    low: visible.filter((profile) => !profile.isUser && profile.leverage < 40),
    self: visible.filter((profile) => profile.isUser),
  };

  // The dossier defaults to the highest-leverage manager still visible, so changing a filter
  // never leaves the right pane showing someone the rail no longer lists.
  const ordered = [...tiers.high, ...tiers.low, ...tiers.self];
  const selected = ordered.find((profile) => profile.rosterId === selectedId) ?? ordered[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        description="Every manager profiled from how they have actually behaved — trade cadence, roster holes, waiver habits, and cross-league tells."
        title="Scouting report"
      />

      {!report.userRosterId ? (
        <Card className="gap-0 border-dashed py-0">
          <CardContent className="flex items-center gap-3 p-4">
            <UserSearchIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Connect your Sleeper account to match these tendencies against your own roster — leverage scores and the
              recommended play for each manager need to know which team is yours.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <ResponsiveTabs label="Filter managers" mode="filter" value={filter} onValueChange={setFilter}
        items={FILTERS.map((entry) => ({ value: entry.id, label: entry.label }))} />

      {visible.length === 0 ? (
        <Empty className="min-h-48 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BinocularsIcon /></EmptyMedia>
            <EmptyTitle>No managers match</EmptyTitle>
            <EmptyDescription>No team in the league fits that filter right now. Try another angle.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        /* Master–detail: the rail ranks who to work, the dossier explains why. Both columns
           lay out at their natural height so the page itself is the only scroller — a pane that
           scrolls inside itself hides how much dossier is left to read. On narrow screens there
           is no second pane, so native disclosures expand each dossier inline instead. */
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {TIERS.map((tier) => {
              const rows = tiers[tier.id];
              if (!rows.length) return null;
              return (
                <section className="flex flex-col gap-2" key={tier.id}>
                  <h2 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", tier.dot)} aria-hidden="true" />
                    {tier.heading}
                    <span className="font-sans text-xs normal-case tracking-normal text-muted-foreground">— {tier.hint}</span>
                  </h2>
                  {rows.map((profile) => {
                    return (
                      <div className="flex flex-col" key={profile.rosterId}>
                        <ManagerCard onSelect={() => setSelectedId(profile.rosterId)} profile={profile} selected={selected?.rosterId === profile.rosterId} />
                        <Disclosure className="lg:hidden" summary={<ManagerIdentity profile={profile} />}
                          onToggle={(event) => { if (event.currentTarget.open) setSelectedId(profile.rosterId); }}>
                          <Dossier profile={profile} showHeader={false} />
                        </Disclosure>
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>

          {selected ? (
            <Card accent className="gap-0 py-0 max-lg:hidden">
              <CardContent className="p-4 md:p-5">
                <Dossier profile={selected} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {!report.historyReady ? (
        <p className="text-xs text-muted-foreground">
          RosterAudit league history is unavailable, so lineup efficiency and rivalry records are hidden. Trade and
          waiver tendencies still come from Sleeper.
        </p>
      ) : null}
    </div>
  );
}
