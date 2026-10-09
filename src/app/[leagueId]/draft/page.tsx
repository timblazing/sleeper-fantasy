import { redirect } from "next/navigation";

export default async function DraftRedirect({ params, searchParams }: { params: Promise<{ leagueId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) qs.append(key, item);
  }
  redirect(`/${leagueId}/draft-insights${qs.size ? `?${qs}` : ""}`);
}
