// Static stand-in for next/navigation in design previews: no router, fixed demo location.
const noop = () => {};
const router = { push: noop, replace: noop, refresh: noop, back: noop, forward: noop, prefetch: noop };

export const useRouter = () => router;
export const usePathname = () => "/demo";
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({ leagueId: "demo" });
export const useSelectedLayoutSegment = (): string | null => null;
export const useSelectedLayoutSegments = (): string[] => [];
export const redirect = noop;
export const notFound = noop;
