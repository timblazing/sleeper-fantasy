import { getNflGameSummary } from "@/lib/nfl-scoreboard-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  if (!/^\d{1,12}$/.test(eventId))
    return Response.json({ error: "Invalid game ID." }, { status: 400 });
  try {
    return Response.json(await getNflGameSummary(eventId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Game details are temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}
