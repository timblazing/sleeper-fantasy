// Preview-only: report prefers-reduced-motion so recharts renders charts at their final frame.
// Capture screenshots right after load, which would otherwise freeze Area/Line series
// mid-animation. Scoped to the preview page; designs built with the bundle keep animations.
if (typeof window !== "undefined" && window.matchMedia) {
  const original = window.matchMedia.bind(window);
  const noop = () => {};
  window.matchMedia = (query: string) => {
    if (!/prefers-reduced-motion:\s*reduce/.test(query)) return original(query);
    return { matches: true, media: query, onchange: null, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop, dispatchEvent: () => false } as MediaQueryList;
  };
}
export {};
