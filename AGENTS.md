## Agent skills

### Issue tracker

Issues live in GitHub Issues on `timblazing/sleeper-fantasy`, via the `gh` CLI.

### Implementation plans

`plans/` holds handoff plans for agent execution. `plans/README.md` is the index:
execution order, dependencies, status, and the findings previously considered and
rejected. Read the index before adding a plan so numbering stays monotonic and
settled findings are not re-audited.

### Verifying a change

| Purpose   | Command             |
|-----------|---------------------|
| Typecheck | `npm run typecheck` |
| Lint      | `npm run lint`      |
| Tests     | `npm test`          |

All three pass on `main`. Run them before proposing a change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
