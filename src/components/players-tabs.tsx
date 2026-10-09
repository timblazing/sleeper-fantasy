"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PlayersTabs({ children, leagueId, username, value }: { children: React.ReactNode; leagueId: string; username?: string; value: "rankings" | "injuries" }) {
  const router = useRouter();
  return (
    <Tabs className="gap-5" value={value} onValueChange={(next) => {
      const params = new URLSearchParams();
      if (username) params.set("username", username);
      if (next === "injuries") params.set("view", "injuries");
      router.push(`/${leagueId}/players${params.size ? `?${params}` : ""}`, { scroll: false });
    }}>
      <TabsList variant="line" aria-label="Players view" className="w-full justify-start pb-2">
        <TabsTrigger className="flex-none px-4" value="rankings">Rankings</TabsTrigger>
        <TabsTrigger className="flex-none px-4" value="injuries">Injury Report</TabsTrigger>
      </TabsList>
      <TabsContent className="flex flex-col gap-6" value={value}>{children}</TabsContent>
    </Tabs>
  );
}
