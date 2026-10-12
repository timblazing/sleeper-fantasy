import { Features } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { ACCOUNT_COOKIE, parseStoredAccount } from "@/lib/account-storage";
import { isLeagueId } from "@/lib/league-id";
import { getShowcaseLeagueId } from "@/lib/showcase";
import { withUsername } from "@/lib/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sleeper Fantasy",
  description: "Matchup forecasts, playoff odds, trade values and draft grades for any Sleeper league. No sign-in — just your username.",
};

// Returning visitors go straight to their remembered league; everyone else gets the landing page.
export default async function Home({ searchParams }: PageProps<"/">) {
  const stored = parseStoredAccount((await cookies()).get(ACCOUNT_COOKIE)?.value);
  if (stored) redirect(withUsername(`/${stored.leagueId}`, stored.username));

  const requested = (await searchParams).league;
  const preselect = typeof requested === "string" && isLeagueId(requested) ? requested : undefined;
  const demoId = await getShowcaseLeagueId();

  return (
    <div className="flex min-h-svh flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero demoHref={demoId ? `/${demoId}` : undefined} preselectLeagueId={preselect} />
        <Features />
      </main>
      <LandingFooter />
    </div>
  );
}
