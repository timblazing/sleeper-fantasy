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
