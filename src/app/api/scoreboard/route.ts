import { getCurrentNflScoreboard } from "@/lib/nfl-scoreboard-server";

export async function GET() {
  try {
    return Response.json(await getCurrentNflScoreboard(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        error:
          "The NFL scoreboard is temporarily unavailable. Please try again.",
      },
      { status: 502 },
    );
  }
}
