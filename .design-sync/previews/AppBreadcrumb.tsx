import { AppBreadcrumb } from "sleeper-fantasy-dashboard";
import { LEAGUE_CHROME, REDRAFT_CHROME } from "./_fixtures/a-chrome";

const Bar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-14 items-center gap-2 border-b px-4">{children}</div>
);

export const DynastyLeague = () => <Bar><AppBreadcrumb league={LEAGUE_CHROME} /></Bar>;

export const RedraftLeague = () => <Bar><AppBreadcrumb league={REDRAFT_CHROME} /></Bar>;
