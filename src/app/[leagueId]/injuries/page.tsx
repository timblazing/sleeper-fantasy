import { redirect } from "next/navigation";
import { injuriesHref, parseInjuryQuery, type InjurySearchParams } from "@/lib/injury-query";

export default async function InjuriesRedirect({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<InjurySearchParams> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  redirect(injuriesHref(leagueId, parseInjuryQuery(query)));
}
