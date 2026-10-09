import { redirect } from "next/navigation";
import { withUsername } from "@/lib/utils";

export default async function LeagueRedirect({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<{ username?: string | string[] }> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  redirect(withUsername(`/${leagueId}`, typeof query.username === "string" ? query.username : undefined));
}
