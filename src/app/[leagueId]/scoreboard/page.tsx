import type { Metadata } from "next";
import { NflScoreboardPage } from "@/components/nfl-scoreboard";

export const metadata: Metadata = { title: "Scoreboard" };

export default function ScoreboardPage() {
  return <NflScoreboardPage />;
}
