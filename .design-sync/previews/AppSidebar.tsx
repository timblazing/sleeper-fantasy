import { AppSidebar } from "sleeper-fantasy-dashboard";
import { InShell } from "./_fixtures/a-shell";
import { LEAGUE_CHROME, REDRAFT_CHROME } from "./_fixtures/a-chrome";

// The desktop sidebar is position:fixed; a transformed box becomes its containing block, so it
// renders in place at a fixed height instead of pinning to the capture viewport.
const Box = ({ children }: { children: React.ReactNode }) => (
  <div style={{ transform: "translateZ(0)", width: "fit-content", height: 600, position: "relative" }}>{children}</div>
);

export const Expanded = () => <InShell height={648}><Box><AppSidebar league={LEAGUE_CHROME} className="h-full" /></Box></InShell>;

export const Redraft = () => <InShell height={648}><Box><AppSidebar league={REDRAFT_CHROME} className="h-full" /></Box></InShell>;

export const CollapsedIconRail = () => <InShell height={648} open={false}><Box><AppSidebar league={LEAGUE_CHROME} className="h-full" /></Box></InShell>;
