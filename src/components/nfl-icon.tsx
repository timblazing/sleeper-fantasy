import { cn } from "@/lib/utils";

export function NflIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 shrink-0 bg-current", className)}
      style={{
        maskImage: "url(/nfl_logo_mono.svg)",
        maskMode: "luminance",
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}
