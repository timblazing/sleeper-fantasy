"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

const THEMES = [
  ["light", Sun],
  ["dark", Moon],
] as const;

const subscribe = () => () => {};

// Fumadocs-style light/dark pill: one button, the active theme's icon sits in a filled circle.
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // The resolved theme is unknown on the server; highlight nothing until mounted to avoid a hydration mismatch.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const value = mounted ? resolvedTheme : null;

  const toggle = () => {
    const next = value === "light" ? "dark" : "light";
    if (document.startViewTransition) document.startViewTransition(() => flushSync(() => setTheme(next)));
    else setTheme(next);
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className={cn(
        "inline-flex shrink-0 items-center overflow-hidden rounded-full border p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {THEMES.map(([key, Icon]) => (
        <Icon
          key={key}
          aria-hidden="true"
          fill="currentColor"
          className={cn(
            "size-6.5 rounded-full p-1.5 transition-colors",
            value === key ? "bg-accent text-accent-foreground" : "text-muted-foreground",
          )}
        />
      ))}
    </button>
  );
}
