import { PageContainer } from "@/components/page-container";
import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function NotFound() {
  return (
    <PageContainer className="flex flex-col gap-6">
      <Empty className="min-h-64 border">
        <EmptyHeader>
          <EmptyMedia variant="icon"><SearchXIcon /></EmptyMedia>
          <EmptyTitle>League not found</EmptyTitle>
          <EmptyDescription>This league id doesn&apos;t match a Sleeper league. Check the link and try again.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/" />}>Back to connect screen</Button>
        </EmptyContent>
      </Empty>
    </PageContainer>
  );
}
