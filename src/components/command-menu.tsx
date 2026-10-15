"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { Monitor, Moon, Search, Sun, TrophyIcon, UserRound, UsersRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { useAccount } from "@/hooks/use-account";
import type { LeagueChrome } from "@/lib/league-chrome";
import { leagueNav, playersNav, resourcesNav, toolsNav } from "@/lib/nav";
import { withUsername } from "@/lib/utils";
import type { MarketPlayer } from "@/lib/player-market";

type TeamOption = { rosterId: number; name: string; manager: string };

const PAGES = [...leagueNav, ...playersNav, ...toolsNav, resourcesNav];
const PLAYER_LIMIT = 8;
const MIN_QUERY = 2;

/** ⌘K / Ctrl+K palette: pages, teams, players, leagues and theme. Teams load on first open;
 *  players are searched server-side (debounced) because the pool is too large to ship. */
export function CommandMenu({ league }: { league: LeagueChrome }) {
  const router = useRouter();
  const username = useSearchParams().get("username") ?? undefined;
  const account = useAccount(username);
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ query: string; items: MarketPlayer[] }>({ query: "", items: [] });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => { if (value) setQuery(""); return !value; });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lazy: nothing is fetched until the first open for this league.
  useEffect(() => {
    if (!open || loadedFor === league.id) return;
    const controller = new AbortController();
    fetch(`/api/leagues/${league.id}/teams`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<{ teams: TeamOption[] }>) : null))
      .then((data) => { if (data) { setTeams(data.teams); setLoadedFor(league.id); } })
      .catch(() => {});
    return () => controller.abort();
  }, [open, league.id, loadedFor]);

  const term = query.trim();
  useEffect(() => {
    if (term.length < MIN_QUERY) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/leagues/${league.id}/players?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((response) => (response.ok ? (response.json() as Promise<{ players: MarketPlayer[] }>) : null))
        .then((data) => { if (data) setPlayers({ query: term, items: data.players.slice(0, PLAYER_LIMIT) }); })
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, league.id]);

  const setOpenAndReset = useCallback((next: boolean) => { setOpen(next); if (!next) setQuery(""); }, []);
  const go = useCallback((href: string) => {
    setOpenAndReset(false);
    router.push(withUsername(href, username));
  }, [router, username, setOpenAndReset]);
  const pick = useCallback((action: () => void) => { setOpenAndReset(false); action(); }, [setOpenAndReset]);

  const matches = players.query === term && term.length >= MIN_QUERY ? players.items : [];
  const otherLeagues = (account?.leagues ?? []).filter((option) => option.id !== league.id);

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setOpen(true)}>
        <Search aria-hidden="true" />
      </Button>
      <Button variant="outline" className="hidden h-9 w-52 justify-start gap-2 rounded-full bg-secondary/50 py-1.5 pr-1.5 pl-3 font-normal text-muted-foreground md:inline-flex" onClick={() => setOpen(true)}>
        <Search aria-hidden="true" />
        <span>Search</span>
        <span className="ml-auto inline-flex gap-0.5">
          {["⌘", "K"].map((key) => <kbd key={key} className="rounded-md border bg-background px-1.5 font-sans text-xs text-muted-foreground">{key}</kbd>)}
        </span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpenAndReset} title="Search" description="Jump to a page, team, player or league, or change theme.">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search pages, teams, players…" />
          <CommandList>
            {matches.length ? null : <CommandEmpty>No results found.</CommandEmpty>}
            <CommandGroup heading="Pages">
              {PAGES.map(({ title, segment, icon: Icon }) => (
                <CommandItem key={title} value={`page ${title}`} onSelect={() => go(`/${league.id}${segment ? `/${segment}` : ""}${segment === "matchups" ? `/${league.matchupWeek}` : ""}`)}>
                  <Icon aria-hidden="true" />{title}
                </CommandItem>
              ))}
            </CommandGroup>
            {teams.length ? <CommandGroup heading="Teams">
              {teams.map((team) => (
                <CommandItem key={team.rosterId} value={`team ${team.name} ${team.manager}`} onSelect={() => go(`/${league.id}/teams/${team.rosterId}`)}>
                  <UsersRoundIcon aria-hidden="true" />{team.name}<CommandShortcut className="tracking-normal">{team.manager}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup> : null}
            {matches.length ? <CommandGroup forceMount heading="Players">
              {/* forceMount: the server already filtered these, so cmdk must not filter them again. */}
              {matches.map(({ player }) => (
                <CommandItem forceMount key={player.id} value={`player ${player.id} ${player.name}`} onSelect={() => go(`/${league.id}/players/${player.id}`)}>
                  <UserRound aria-hidden="true" />{player.name}<CommandShortcut className="tracking-normal">{[player.position, player.team ?? "FA"].filter(Boolean).join(" · ")}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup> : null}
            {otherLeagues.length ? <CommandGroup heading="Leagues">
              {otherLeagues.map((option) => (
                <CommandItem key={option.id} value={`league ${option.name}`} onSelect={() => go(`/${option.id}`)}>
                  <TrophyIcon aria-hidden="true" />{option.name}<CommandShortcut className="tracking-normal">{option.type}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup> : null}
            <CommandSeparator />
            <CommandGroup heading="Theme">
              <CommandItem value="theme light" onSelect={() => pick(() => setTheme("light"))}><Sun aria-hidden="true" />Light</CommandItem>
              <CommandItem value="theme dark" onSelect={() => pick(() => setTheme("dark"))}><Moon aria-hidden="true" />Dark</CommandItem>
              <CommandItem value="theme system" onSelect={() => pick(() => setTheme("system"))}><Monitor aria-hidden="true" />System</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
