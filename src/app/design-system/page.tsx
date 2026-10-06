import Link from "next/link";
import { ComponentSpecimens } from "@/components/component-specimens";
import { PageContainer } from "@/components/page-container";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Design system", robots: { index: false, follow: false } };

export default async function DesignSystemPage({ searchParams }: { searchParams: Promise<{ position?: string | string[] }> }) {
  const params = await searchParams;
  const position = typeof params.position === "string" ? params.position : "all";
  return (
    <>
      <header className="flex h-[60px] items-center border-b px-4 md:px-6">
        <Link className="text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-ring" href="/">Sleeper Fantasy</Link>
      </header>
      <main><PageContainer className="space-y-8 py-8">
        <header className="space-y-3">
          <h1 className="type-display">Design system</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">Shared foundations and fantasy components, using example data. Appearance follows your system preference.</p>
          <a className="text-sm underline underline-offset-4" href="https://components.blasingame.dev/foundations">Foundations on blasingame.dev</a>
        </header>
        <ComponentSpecimens position={position} />
      </PageContainer></main>
      <SiteFooter />
    </>
  );
}
