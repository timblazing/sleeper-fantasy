#!/usr/bin/env node
// Builds the player catalog and weekly projection snapshots the Cloudflare Worker reads from R2.
// Run by .github/workflows/sleeper-snapshots.yml; needs Node 22.18+ for TypeScript type stripping.
//
//   node scripts/sleeper-snapshots.mjs --catalog --projections [--all-weeks] [--out <dir>] [--dry-run]
//
// --catalog      fetch /players/nfl once, trim, upload a new versioned snapshot, then move the pointer
// --projections  refresh the current and next week, and backfill any past week with no snapshot
// --all-weeks    also refresh every later week of the regular season (the daily run)
// --out <dir>    also write every file locally (for measuring size and parse cost)
// --dry-run      skip R2 entirely
//
// Env: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (S3 credentials of a token scoped
// to the bucket), R2_BUCKET (default sleeper-fantasy-cache).
import { createHash, createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  CATALOG_POINTER_KEY, CATALOG_PREFIX, CATALOG_SHARDS, PROJECTIONS_PREFIX, SNAPSHOT_SCHEMA, catalogShardKey, encodeCatalogShard,
  encodeProjections, projectionsKey, shardOf, trimCatalog, trimProjections,
} from "../src/lib/snapshot-format.ts";

const { values: args } = parseArgs({
  options: {
    catalog: { type: "boolean", default: false },
    projections: { type: "boolean", default: false },
    "all-weeks": { type: "boolean", default: false },
    out: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

const SLEEPER = "https://api.sleeper.app/v1";
const SLEEPER_PROJECTIONS = "https://api.sleeper.com";
const USER_AGENT = "Sleeper Fantasy/0.1 (snapshot job)";
const REGULAR_SEASON_WEEKS = 18;
// A healthy feed has ~12,000 players. Anything far smaller is a truncated or broken response, and
// publishing it would replace a good snapshot with a bad one.
const MIN_PLAYERS = 5000;
const KEEP_CATALOG_VERSIONS = 7;

const bucket = process.env.R2_BUCKET || "sleeper-fantasy-cache";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const dryRun = args["dry-run"];
const { R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey } = process.env;
if (!dryRun && (!accountId || !accessKeyId || !secretAccessKey)) throw new Error("CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required (or pass --dry-run)");

const summary = [];
const log = (line) => { console.log(line); summary.push(line); };

async function sleeper(url) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

// Bucket-scoped tokens only work through R2's S3 API, not the Cloudflare REST API, so requests are
// signed with AWS Signature V4 here (kept dependency-free so the hourly job needs no npm install).
const host = `${accountId}.r2.cloudflarestorage.com`;
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const rfc3986 = (value) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

function r2(method, key = "", query = {}, body = "") {
  const pathname = `/${bucket}${key ? `/${key.split("/").map(rfc3986).join("/")}` : ""}`;
  const search = Object.keys(query).sort().map((name) => `${rfc3986(name)}=${rfc3986(query[name])}`).join("&");
  const amzDate = new Date().toISOString().replace(/[-:]|\.\d{3}/g, "");
  const scope = `${amzDate.slice(0, 8)}/auto/s3/aws4_request`;
  const payloadHash = sha256(body);
  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const signedHeaders = Object.keys(headers).join(";");
  const canonical = [method, pathname, search, ...Object.entries(headers).map(([name, value]) => `${name}:${value}`), "", signedHeaders, payloadHash].join("\n");
  const signingKey = ["auto", "s3", "aws4_request"].reduce(hmac, hmac(`AWS4${secretAccessKey}`, amzDate.slice(0, 8)));
  const signature = createHmac("sha256", signingKey).update(`AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256(canonical)}`).digest("hex");
  return fetch(`https://${host}${pathname}${search ? `?${search}` : ""}`, {
    method,
    body: body || undefined,
    headers: {
      "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate,
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
}

async function put(key, body) {
  if (args.out) {
    const file = path.join(args.out, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  }
  if (dryRun) return;
  const response = await r2("PUT", key, {}, body);
  if (!response.ok) throw new Error(`R2 put ${key} returned ${response.status}: ${await response.text()}`);
}

async function list(prefix) {
  if (dryRun) return [];
  const keys = [];
  let token;
  do {
    const response = await r2("GET", "", { "list-type": "2", prefix, ...(token ? { "continuation-token": token } : {}) });
    const xml = await response.text();
    if (!response.ok) throw new Error(`R2 list ${prefix} returned ${response.status}: ${xml}`);
    keys.push(...[...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((match) => match[1].replaceAll("&amp;", "&")));
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1] : undefined;
  } while (token);
  return keys;
}

async function remove(key) {
  if (dryRun) return;
  const response = await r2("DELETE", key);
  if (!response.ok && response.status !== 404) throw new Error(`R2 delete ${key} returned ${response.status}`);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function snapshotCatalog() {
  const generatedAt = new Date().toISOString();
  const version = generatedAt.replace(/[:.]/g, "-");
  const players = trimCatalog(await sleeper(`${SLEEPER}/players/nfl`));
  if (players.size < MIN_PLAYERS) throw new Error(`Player feed has only ${players.size} players; keeping the previous snapshot`);

  const byShard = Object.fromEntries(CATALOG_SHARDS.map((shard) => [shard, []]));
  for (const player of players.values()) byShard[shardOf(player)].push(player);

  const shards = {};
  for (const shard of CATALOG_SHARDS) {
    const key = catalogShardKey(version, shard);
    const body = JSON.stringify(encodeCatalogShard(byShard[shard]));
    await put(key, body);
    shards[shard] = { key, count: byShard[shard].length, bytes: Buffer.byteLength(body) };
    log(`catalog ${shard}: ${shards[shard].count} players, ${kb(shards[shard].bytes)}`);
  }
  // The pointer moves only after every shard is in place, so a reader never sees a half-written version.
  await put(CATALOG_POINTER_KEY, JSON.stringify({ schema: SNAPSHOT_SCHEMA, version, generatedAt, shards }));
  log(`catalog pointer -> ${version}`);

  const versions = [...new Set((await list(`${CATALOG_PREFIX}/`)).map((key) => key.slice(CATALOG_PREFIX.length + 1).split("/")).filter((parts) => parts.length === 2).map(([dir]) => dir))].sort();
  const stale = versions.filter((dir) => dir !== version).slice(0, -KEEP_CATALOG_VERSIONS + 1 || undefined);
  for (const dir of stale) for (const shard of CATALOG_SHARDS) await remove(catalogShardKey(dir, shard));
  if (stale.length) log(`pruned ${stale.length} old catalog version(s)`);
}

async function snapshotProjections() {
  const state = await sleeper(`${SLEEPER}/state/nfl`);
  const season = String(state.season);
  // Before and after the regular season there is no "current" week; week 1 is the useful one.
  const current = state.season_type === "regular" ? Math.min(Math.max(Number(state.week) || 1, 1), REGULAR_SEASON_WEEKS) : 1;
  const refresh = new Set([current, Math.min(current + 1, REGULAR_SEASON_WEEKS)]);
  if (args["all-weeks"]) for (let week = current; week <= REGULAR_SEASON_WEEKS; week++) refresh.add(week);

  // Past weeks keep the projections they had when they were last current; only fill gaps.
  const existing = new Set(await list(`${PROJECTIONS_PREFIX}/${season}/`));
  for (let week = 1; week < current; week++) if (!existing.has(projectionsKey(season, week))) refresh.add(week);

  const generatedAt = new Date().toISOString();
  for (const week of [...refresh].sort((a, b) => a - b)) {
    const rows = await sleeper(`${SLEEPER_PROJECTIONS}/projections/nfl/${season}/${week}?season_type=regular`);
    const projections = trimProjections(rows);
    const body = JSON.stringify(encodeProjections(season, week, projections, generatedAt));
    await put(projectionsKey(season, week), body);
    log(`projections ${season} week ${week}: ${projections.size} players, ${kb(Buffer.byteLength(body))}`);
  }
}

if (!args.catalog && !args.projections) throw new Error("Pass --catalog and/or --projections");
if (args.catalog) await snapshotCatalog();
if (args.projections) await snapshotProjections();
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary.map((line) => `- ${line}`).join("\n") + "\n", { flag: "a" });
