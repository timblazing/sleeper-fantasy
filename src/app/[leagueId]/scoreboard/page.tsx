import { redirect } from "next/navigation";

// Keep stale bookmarks useful after scoreboard moves into the shared app chrome.
export default async function ScoreboardRedirect({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  redirect(`/${leagueId}`);
}
