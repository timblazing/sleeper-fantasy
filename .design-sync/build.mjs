#!/usr/bin/env node
// Builds a package-shaped view of the app's in-use custom components into .ds-pkg/ for the
// design-sync converter: dist/index.mjs (ESM, React external), types/ (.d.ts), dist/styles.css.
//
// Scope = every non-ui component under src/components reachable by imports from the
// src/app/[leagueId] routes (pages, layouts, loading/error states), plus DsRoot. Components
// that only unused code reaches never enter the bundle.
//
// Usage: node .design-sync/build.mjs   (needs .ds-sync/node_modules for esbuild)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const OUT = join(ROOT, ".ds-pkg");
const DS = join(ROOT, ".design-sync");
const esbuild = createRequire(join(ROOT, ".ds-sync", "package.json"))("esbuild");
const appRequire = createRequire(join(ROOT, "package.json"));
// The converter's own React shim: react / react-dom / react-is / scheduler resolve to the page's
// window.React, including CommonJS require() calls inside deps (a plain external can't serve those).
const { reactShim } = await import(join(ROOT, ".ds-sync/lib/bundle.mjs"));

// -- 1. scope: import closure of the league routes --------------------------------------
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
function resolveImport(spec, from) {
  const base = spec.startsWith("@/") ? join(ROOT, "src", spec.slice(2)) : spec.startsWith(".") ? resolve(dirname(from), spec) : null;
  if (!base) return null;
  for (const ext of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const p = base + ext;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}
const entries = walk(join(ROOT, "src/app/[leagueId]")).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f));
const seen = new Set();
const queue = [...entries];
while (queue.length) {
  const f = queue.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  for (const m of readFileSync(f, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
    const r = resolveImport(m[1], f);
    if (r && !seen.has(r)) queue.push(r);
  }
}
const compDir = join(ROOT, "src/components") + "/";
const components = [...seen].filter((f) => f.startsWith(compDir) && !f.startsWith(compDir + "ui/")).sort();
console.error(`[ds] ${components.length} in-use custom components`);

// -- 2. barrel -----------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "dist"), { recursive: true });
const rel = (p) => {
  const r = relative(OUT, p).replace(/\.tsx?$/, "");
  return r.startsWith(".") ? r : "./" + r;
};
const barrel = [...components, join(DS, "ds-root.tsx")].map((p) => `export * from ${JSON.stringify(rel(p))};`).join("\n") + "\n";
writeFileSync(join(OUT, "index.ts"), barrel);
writeFileSync(join(OUT, "package.json"), JSON.stringify({ name: "sleeper-fantasy-dashboard", version: "0.1.0", module: "dist/index.mjs", types: "types/index.d.ts" }, null, 2));

// -- 3. JS: ESM bundle, React from window, Next runtime swapped for static shims ----------
const shim = (name) => join(DS, "shims", name);
await esbuild.build({
  entryPoints: [join(OUT, "index.ts")],
  outfile: join(OUT, "dist/index.mjs"),
  bundle: true,
  format: "esm",
  platform: "browser",
  jsx: "automatic",
  target: "es2020",
  tsconfig: join(ROOT, "tsconfig.json"),
  plugins: [reactShim],
  alias: {
    "next/link": shim("next-link.tsx"),
    "next/navigation": shim("next-navigation.ts"),
    "next/image": shim("next-image.tsx"),
    "server-only": shim("server-only.ts"),
  },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
  logOverride: { "unsupported-directive": "silent" },
});

// Root-relative public/ assets (served by Next at /) don't exist in a design project - inline them.
{
  const jsPath = join(OUT, "dist/index.mjs");
  let js = readFileSync(jsPath, "utf8");
  js = js.replace(/url\((\/[\w.-]+\.svg)\)/g, (m, asset) => {
    const file = join(ROOT, "public", asset);
    if (!existsSync(file)) { console.error(`[ds] ! ${m}: no public${asset} to inline`); return m; }
    return `url(data:image/svg+xml;base64,${readFileSync(file).toString("base64")})`;
  });
  writeFileSync(jsPath, js);
}

// -- 4. types: tsc declaration emit, @/ aliases rewritten to relative paths -------------
const tsconfig = {
  extends: "../tsconfig.json",
  compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true, incremental: false, outDir: "./types", rootDir: "..", plugins: [] },
  files: ["../next-env.d.ts", "./index.ts"],
  include: [],
};
writeFileSync(join(OUT, "tsconfig.dts.json"), JSON.stringify(tsconfig, null, 2));
try {
  execFileSync(join(ROOT, "node_modules/.bin/tsc"), ["-p", join(OUT, "tsconfig.dts.json")], { stdio: "pipe" });
} catch (e) {
  // Type errors don't block declaration emit; surface them without failing the build.
  console.error(`[ds] tsc reported diagnostics (declarations still emitted):\n${String(e.stdout).split("\n").slice(0, 10).join("\n")}`);
}
const typesDir = join(OUT, "types");
for (const f of walk(typesDir).filter((f) => f.endsWith(".d.ts"))) {
  const src = readFileSync(f, "utf8");
  const out = src.replace(/(["'])@\/([^"']+)\1/g, (_, q, p) => {
    let r = relative(dirname(f), join(typesDir, "src", p));
    if (!r.startsWith(".")) r = "./" + r;
    return q + r + q;
  });
  if (out !== src) writeFileSync(f, out);
}
writeFileSync(join(typesDir, "index.d.ts"), readFileSync(join(typesDir, ".ds-pkg/index.d.ts"), "utf8").replace(/(["'])\.\.\//g, "$1./"));

// -- 5. CSS: the app's Tailwind stylesheet, compiled against the bundle + previews ----
const safelist = [
  "{bg,text,border}-{background,foreground,card,card-foreground,popover,popover-foreground,primary,primary-foreground,secondary,secondary-foreground,muted,muted-foreground,accent,accent-foreground,destructive,border,input,ring,positive,negative,warning,sidebar,sidebar-foreground,sidebar-accent,sidebar-border}",
  "{bg,text,border,fill,stroke}-{chart-1,chart-2,chart-3,chart-4,chart-5,series-1,series-2,series-3,series-4,series-5,series-6,series-7,series-8}",
  "{bg,text}-position-{qb,rb,wr,te}-{background,foreground}",
  "{bg,text,border}-{primary,positive,negative,warning,destructive,muted}/{10,20,30,50}",
  "{flex,inline-flex,grid,block,inline-block,hidden,contents,flex-col,flex-row,flex-wrap,flex-1,shrink-0,grow,items-start,items-center,items-end,items-baseline,justify-start,justify-center,justify-end,justify-between,self-start,self-center,relative,absolute,sticky,overflow-hidden,overflow-auto,overflow-x-auto,truncate,tabular-nums,font-mono,font-sans,uppercase,capitalize,italic,underline,whitespace-nowrap,text-left,text-center,text-right,w-full,h-full,min-w-0,min-h-0,size-full,border,border-t,border-b,border-l,border-r,border-dashed,divide-y,shadow-xs,shadow-sm,shadow-md,leading-none,leading-tight,leading-snug,leading-relaxed,tracking-tight,tracking-wide,sr-only}",
  "{sm:,md:,lg:,xl:,}{grid-cols-1,grid-cols-2,grid-cols-3,grid-cols-4,grid-cols-5,grid-cols-6,grid-cols-12,col-span-1,col-span-2,col-span-3,col-span-4,col-span-6,col-span-12,flex-row,flex-col,hidden,block,flex,grid}",
  "{gap,gap-x,gap-y,p,px,py,pt,pb,pl,pr,m,mx,my,mt,mb,ml,mr,space-y,space-x}-{0,0.5,1,1.5,2,2.5,3,4,5,6,8,10,12,16}",
  "{w,h,size,min-w,max-h}-{4,5,6,8,10,12,16,20,24,32,40,48,64}",
  "max-w-{xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,screen-xl}",
  "text-{xs,sm,base,lg,xl,2xl,3xl,4xl} font-{normal,medium,semibold,bold} rounded{,-sm,-md,-lg,-xl,-2xl,-full}",
];
cpSync(join(DS, "fonts"), join(OUT, "dist/fonts"), { recursive: true });
const wrapper = [
  `@import "../../src/app/globals.css";`,
  `@import "./fonts/geist.css";`,
  `@source "./index.mjs";`,
  `@source "../../.design-sync/previews";`,
  ...safelist.map((s) => `@source inline(${JSON.stringify(s)});`),
  "",
].join("\n");
writeFileSync(join(OUT, "dist/styles.src.css"), wrapper);
const postcss = appRequire("postcss");
const tailwind = appRequire("@tailwindcss/postcss");
const css = await postcss([tailwind({ base: OUT, optimize: false })]).process(wrapper, { from: join(OUT, "dist/styles.src.css"), to: join(OUT, "dist/styles.css") });
writeFileSync(join(OUT, "dist/styles.css"), css.css);
// -- 6. docs: page group + the data types each component's props reach -----------------
// The converter's per-component .d.ts names prop types (MatchupDetail, RosterSlot...) without
// defining them. Each component gets a generated doc (.ds-pkg/docs/<Name>.md) carrying its
// page group and the transitive type declarations from src/lib, so the design agent can build
// valid data for it.
const GROUPS = {
  Layout: "DsRoot LeagueShell AppSidebar AppBreadcrumb NavMain NavProjects NavUser TeamSwitcher SiteFooter PageContainer PageHeader RememberAccount",
  Dashboard: "Overview MatchupSummary MatchupLineup MatchupBoard KickoffTime PositionalScarcityCard RecommendedActionsCard",
  Scoreboard: "NflScoreboardPage",
  League: "HistoryChampions HistoryLeaderboard HistoryRecords PlayoffRace SeasonTimelineCard",
  Players: "RankingsTable RankingsToolbar RankingsPagination RankingsSearch",
  Player: "PlayerDetail PlayerHero PlayerAdvanced PlayerCareerTable PlayerPercentiles PlayerProjection PlayerValueChart PlayerWeeklyChart PlayerSnapTrend PlayerCliffRiskCard PlayerInjuryCard PlayerContractCard PlayerCombineCard PlayerTradeMarketCard PlayerRelatedCards",
  Draft: "DraftWorkspace GradeBadge ManagerAvatar SurplusBar PlayerHeadshot SortHeader",
  Injuries: "InjuryReportTable InjuryToolbar InjurySearch",
  Trade: "TradeCalculator",
  Team: "TeamDetail",
  Scouting: "ScoutingReportView",
  Resources: "ResourceCard",
  Shared: "PositionBadge TeamLink NflIcon ResponsiveDialog",
};
const groupOf = new Map(Object.entries(GROUPS).flatMap(([g, names]) => names.split(" ").map((n) => [n, g])));
const ts = appRequire("typescript");
const declsIn = (file) => {
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const out = new Map();
  for (const st of sf.statements) {
    if (ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isEnumDeclaration(st)) out.set(st.name.text, st.getText().replace(/^export declare |^export |^declare /, ""));
  }
  return { sf, out };
};
const libDecls = new Map();
for (const f of walk(join(typesDir, "src/lib")).filter((f) => f.endsWith(".d.ts"))) {
  for (const [k, v] of declsIn(f).out) if (!libDecls.has(k)) libDecls.set(k, v);
}
const TYPE_CAP = 6000;
mkdirSync(join(OUT, "docs"), { recursive: true });
let documented = 0;
for (const file of [...components, join(DS, "ds-root.tsx")]) {
  const dts = join(typesDir, relative(ROOT, file).replace(/\.tsx?$/, ".d.ts"));
  if (!existsSync(dts)) continue;
  const { sf, out: local } = declsIn(dts);
  for (const st of sf.statements) {
    const names = ts.isFunctionDeclaration(st) && st.name ? [[st.name.text, st.parameters[0]?.type]]
      : ts.isVariableStatement(st) ? st.declarationList.declarations.map((d) => [d.name.getText(), d.type]) : [];
    for (const [name, typeNode] of names) {
      if (!groupOf.has(name)) continue;
      const seenT = new Set(), blocks = [];
      const queueT = [...(typeNode?.getText() ?? "").matchAll(/\b[A-Z]\w*\b/g)].map((m) => m[0]);
      let size = 0;
      while (queueT.length) {
        const t = queueT.shift();
        if (seenT.has(t)) continue;
        seenT.add(t);
        const decl = local.get(t) ?? libDecls.get(t);
        if (!decl || size + decl.length > TYPE_CAP) continue;
        blocks.push(decl);
        size += decl.length;
        queueT.push(...[...decl.matchAll(/\b[A-Z]\w*\b/g)].map((m) => m[0]));
      }
      const body = blocks.length ? `## Data types\n\nProp types referenced above, as declared in the app (\`src/lib\`):\n\n\`\`\`ts\n${blocks.join("\n")}\n\`\`\`\n` : "";
      writeFileSync(join(OUT, "docs", `${name}.md`), `---\ncategory: ${groupOf.get(name)}\n---\n${body}`);
      documented++;
    }
  }
}
const missing = [...groupOf.keys()].filter((n) => !existsSync(join(OUT, "docs", `${n}.md`)));
if (missing.length) console.error(`[ds] no generated doc for: ${missing.join(", ")} (not an export of an in-scope file, or missing from GROUPS)`);

console.error(`[ds] wrote .ds-pkg (js ${(statSync(join(OUT, "dist/index.mjs")).size / 1024) | 0}KB, css ${(css.css.length / 1024) | 0}KB)`);
