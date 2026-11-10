"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { rememberAccount } from "@/lib/account-storage";
import { readJson } from "@/lib/async-view";
import type { LeagueOption, SleeperAccount } from "@/lib/types";
import { leagueAvatarProxyUrl, withUsername } from "@/lib/utils";
import { ArrowRight, ChevronRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * The connect flow, one step at a time. Step 1 looks the username up; step 2 (same page) lets a
 * multi-league user choose. A returning visitor never gets here — `/` redirects on the server
 * from the account cookie.
 */
type Step =
  | { kind: "entering"; error?: string }
  | { kind: "looking-up" }
  | { kind: "choosing"; username: string; leagues: LeagueOption[]; openingId?: string }
  | { kind: "opening" };

export function ConnectForm({ preselectLeagueId, demoHref }: { preselectLeagueId?: string; demoHref?: string }) {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [step, setStep] = React.useState<Step>({ kind: "entering" });
  const valid = username.trim().length > 0 && username.trim().length <= 50;
  const busy = step.kind === "looking-up" || step.kind === "opening";
  const error = step.kind === "entering" ? step.error ?? "" : "";

  function open(leagueId: string, name: string) {
    rememberAccount({ leagueId, username: name });
    router.push(withUsername(`/${leagueId}`, name));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || busy) return;
    setStep({ kind: "looking-up" });
    try {
      const response = await fetch(`/api/leagues?username=${encodeURIComponent(username.trim())}`);
      const result = await readJson<SleeperAccount & { error: string }>(response);
      if (!response.ok || !result.username || !result.leagues?.length) throw new Error(result.error || "No NFL leagues were found.");
      const wanted = preselectLeagueId ? result.leagues.find((league) => league.id === preselectLeagueId) : undefined;
      const direct = wanted ?? (result.leagues.length === 1 ? result.leagues[0] : undefined);
      if (direct) {
        setStep({ kind: "opening" });
        open(direct.id, result.username);
        return;
      }
      setStep({ kind: "choosing", username: result.username, leagues: result.leagues });
    } catch (cause) {
      setStep({ kind: "entering", error: cause instanceof Error && cause.message ? cause.message : "We couldn't load your Sleeper leagues." });
    }
  }

  if (step.kind === "choosing") {
    const found = step;
    const opening = found.openingId !== undefined;
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl bg-background/90 p-2 text-left backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">Leagues for <span className="font-medium text-foreground">{found.username}</span></p>
          <Button disabled={opening} onClick={() => setStep({ kind: "entering" })} size="sm" type="button" variant="ghost">Change</Button>
        </div>
        <ul aria-busy={opening} aria-label="Your leagues" className="divide-y overflow-hidden rounded-xl border bg-card">
          {found.leagues.map((league) => (
            <li key={league.id}>
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
                disabled={opening}
                onClick={() => { setStep({ ...found, openingId: league.id }); open(league.id, found.username); }}
                type="button"
              >
                <Avatar className="size-9" shape={league.avatar ? "logo" : "circle"}>
                  {league.avatar ? <AvatarImage alt="" src={leagueAvatarProxyUrl(league.avatar)} /> : null}
                  <AvatarFallback>{league.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{league.name}</span>
                  <span className="block text-xs text-muted-foreground">{league.season} season</span>
                </span>
                <Badge variant="secondary">{league.type}</Badge>
                {found.openingId === league.id
                  ? <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  : <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        className="flex items-center gap-1 rounded-full border bg-background p-1 shadow-xs transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid=true]:border-destructive"
        data-invalid={error ? true : undefined}
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor="sleeper-username">Sleeper username</label>
        <input
          aria-describedby={error ? "username-error" : undefined}
          aria-invalid={Boolean(error)}
          autoCapitalize="none"
          autoComplete="username"
          autoFocus
          className="h-10 min-w-0 flex-1 bg-transparent pl-4 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          id="sleeper-username"
          onChange={(event) => { setUsername(event.target.value); if (error) setStep({ kind: "entering" }); }}
          placeholder="Sleeper username"
          spellCheck={false}
          value={username}
        />
        <Button className="h-10 rounded-full px-4" disabled={!valid || busy} type="submit">
          {busy
            ? <><LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />Finding leagues…</>
            : <>Find my leagues<ArrowRight data-icon="inline-end" aria-hidden="true" /></>}
        </Button>
      </form>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-destructive-text" id="username-error" role="status">{error}</p>
      {demoHref ? (
        <p className="mt-1 text-sm text-muted-foreground">
          or <a className="font-medium text-foreground underline underline-offset-4 hover:text-primary" href={demoHref}>try a demo league</a>
        </p>
      ) : null}
    </div>
  );
}
