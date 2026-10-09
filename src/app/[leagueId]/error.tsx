"use client";

import { PageContainer } from "@/components/page-container";
import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <Empty className="min-h-64 border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><TriangleAlertIcon /></EmptyMedia>
          <EmptyTitle>This league page could not be loaded</EmptyTitle>
          <EmptyDescription>Sleeper did not return the data this page needs. Try again shortly.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => retry()}>Try again</Button>
        </EmptyContent>
      </Empty>
    </PageContainer>
  );
}
