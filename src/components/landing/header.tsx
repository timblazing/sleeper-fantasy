"use client";

import { GITHUB_URL } from "@/components/landing/links";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";



// Borderless over the hero; picks up a hairline and frosted background once the page scrolls.
export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 h-[60px] border-b transition-colors duration-200", scrolled ? "border-border bg-background/80 backdrop-blur" : "border-transparent bg-transparent")}>
      <div className="mx-auto flex h-full max-w-[1240px] items-center justify-between px-4 sm:px-6">
        <Link className="type-title rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50" href="/">Sleeper Fantasy</Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          <a className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground" href="#features">Features</a>
          <a className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground" href={GITHUB_URL} rel="noreferrer" target="_blank">GitHub</a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
