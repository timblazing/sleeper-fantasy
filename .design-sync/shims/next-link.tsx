// Static stand-in for next/link in design previews: a plain anchor, Next-only props dropped.
import * as React from "react";

type Href = string | { pathname?: string; query?: Record<string, string | number | undefined> };
type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href;
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
};

function toHref(href: Href): string {
  if (typeof href === "string") return href;
  const q = Object.entries(href.query ?? {}).filter(([, v]) => v !== undefined);
  return (href.pathname ?? "") + (q.length ? "?" + q.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&") : "");
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _p, replace: _r, scroll: _s, shallow: _sh, onClick, ...rest },
  ref,
) {
  return (
    <a
      ref={ref}
      href={toHref(href)}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
      }}
      {...rest}
    />
  );
});

export default Link;
