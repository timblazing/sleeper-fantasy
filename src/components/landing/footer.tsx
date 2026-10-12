import { GITHUB_URL } from "@/components/landing/links";

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-sm text-muted-foreground sm:px-6">
        <span className="font-medium text-foreground">Sleeper Fantasy</span>
        <p>
          Not affiliated with Sleeper ·{" "}
          <a className="underline-offset-4 hover:text-foreground hover:underline" href={GITHUB_URL} rel="noreferrer" target="_blank">GitHub</a>
        </p>
      </div>
    </footer>
  );
}
