# Errors

## [ERR-20260709-001] prettier-astro-formatting

**Logged**: 2026-07-09T21:02:00Z
**Priority**: low
**Status**: resolved
**Area**: config

### Summary

The repository's Prettier installation cannot infer a parser for Astro files.

### Error

```
[error] No parser could be inferred for file "src/layouts/BaseLayout.astro".
```

### Context

- Attempted to format changed `.astro` templates with `npx prettier --write`.
- Prettier formatted TypeScript and MDX files, then exited with code 2 for Astro files.
- The project does not include `prettier-plugin-astro`.

### Suggested Fix

Use `astro check` and `astro build` to validate Astro templates. Add `prettier-plugin-astro` only if consistent Astro formatting becomes a project requirement.

### Metadata

- Reproducible: yes
- Related Files: package.json, src/layouts/BaseLayout.astro

### Resolution

- **Resolved**: 2026-07-09T21:02:00Z
- **Notes**: Validation continued with the repository's Astro build pipeline.

---

## [ERR-20260715-001] parent-agent-file-scan

**Logged**: 2026-07-15T17:58:14Z
**Priority**: low
**Status**: resolved
**Area**: config

### Summary

An unrestricted parent-directory search for `AGENTS.md` exceeded the command timeout.

### Error

```
command timed out after 10019 milliseconds
```

### Context

- The SEO audit context command used `find .. -name AGENTS.md -print` from the repository root.
- The required SEO skill and marketing-context result completed before the search timed out.

### Suggested Fix

Limit instruction-file searches to the repository with `rg --files -g AGENTS.md`.

### Metadata

- Reproducible: yes
- Related Files: none

### Resolution

- **Resolved**: 2026-07-15T17:58:14Z
- **Notes**: The follow-up search was scoped to the current repository.

---

## [ERR-20260715-002] browser-skill-cache-path

**Logged**: 2026-07-15T17:58:14Z
**Priority**: low
**Status**: resolved
**Area**: config

### Summary

The cached browser skill version changed, so the previously listed versioned path no longer existed.

### Error

```
cat: .../browser/26.707.30751/skills/control-in-app-browser/SKILL.md: No such file or directory
```

### Context

- Attempted to read a versioned cached skill path from prior session context.
- The installed browser skill is now under version `26.707.72221`.

### Suggested Fix

Resolve the current cached skill path before reading versioned plugin skills.

### Metadata

- Reproducible: yes
- Related Files: none

### Resolution

- **Resolved**: 2026-07-15T17:58:14Z
- **Notes**: Located the current skill with `rg --files` and continued with that path.

---
## [ERR-20260715-003] pagespeed-public-api-quota

**Logged**: 2026-07-15
**Priority**: low
**Status**: resolved
**Area**: tooling

### Summary
Google PageSpeed Insights' public API returned HTTP 429 because the anonymous project has a zero daily query quota.

### Error
`RESOURCE_EXHAUSTED: Quota exceeded for pagespeedonline.googleapis.com/default`

### Context
Attempted to collect current mobile performance and SEO scores for `https://hoyelam.com/` during an SEO audit.

### Resolution
Reported performance findings from the local asset and HTML audit, and marked field Core Web Vitals as requiring Search Console/CrUX verification instead of claiming an unmeasured score.

### Prevention
Prefer an authenticated PSI API key, Search Console Core Web Vitals data, or a locally installed Lighthouse runtime for future audits.

---
## [ERR-20260715-004] prettier-astro-parser

**Logged**: 2026-07-15
**Priority**: low
**Status**: resolved
**Area**: config

### Summary
The repository's Prettier installation cannot infer a parser for `.astro` files.

### Error
`No parser could be inferred for file ... .astro`

### Context
Ran the local Prettier binary against the SEO implementation files. JavaScript, Markdown, MDX, and CSS were formatted successfully before Prettier rejected the Astro files.

### Suggested Fix
Use `astro check` as the authoritative validator, or add `prettier-plugin-astro` if automatic Astro formatting becomes a project requirement.

### Metadata
- Reproducible: yes
- Related Files: package.json
- See Also: ERR-20260709-001

### Resolution
- **Resolved**: 2026-07-15
- **Notes**: Continued with the repository's existing `astro check` build validation rather than adding an unrelated formatting dependency.

---
## [ERR-20260715-005] git-index-sandbox-permission

**Logged**: 2026-07-15
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
Staging failed because the managed filesystem allows reading `.git` but requires escalation to create `index.lock`.

### Error
`fatal: Unable to create '.git/index.lock': Operation not permitted`

### Context
Attempted to stage the verified SEO implementation while intentionally excluding `.learnings/`.

### Suggested Fix
Run repository index mutations with the approved escalated `git add` capability in this workspace.

### Metadata
- Reproducible: yes
- Related Files: .git/index

### Resolution
- **Resolved**: 2026-07-15
- **Notes**: Re-ran the same scoped `git add` command with managed escalation; staging succeeded.

---
## [ERR-20260715-006] gh-api-sandbox-network

**Logged**: 2026-07-15
**Priority**: low
**Status**: resolved
**Area**: infra

### Summary
The first GitHub Actions status query could not reach `api.github.com` from the restricted network sandbox.

### Error
`error connecting to api.github.com`

### Context
Queried the GitHub Pages deployment after pushing the SEO implementation.

### Suggested Fix
Use the approved escalated `gh run list` capability for authenticated GitHub API reads in this workspace.

### Metadata
- Reproducible: yes
- Related Files: .github/workflows/deploy.yml

### Resolution
- **Resolved**: 2026-07-15
- **Notes**: Re-ran with managed network escalation and confirmed the deployment workflow is in progress for commit `5a4316a`.

---
