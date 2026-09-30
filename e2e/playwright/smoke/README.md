# Screen smoke coverage

The [screen inventory](../../SCREEN_INVENTORY.md) lists every application page by functional area, representative route, expected heading and coverage status. Its source, [screens.json](screens.json), drives the smoke tests. There are 251 application page templates, all covered, plus an inventory consistency check. The existing detailed Playwright journeys remain separate.

## Scope and exclusions

A screen is a full application page template. A template shared by create/edit routes or several parameters needs one representative render, rather than a test for every state or validation error. Both templates are included when a handler can render different full pages. Partials, layouts, tabs and components are exercised within their owning page. The smoke suite does not prove all controls, hidden panels, links or data transformations work.

| Excluded surface | Reason |
| --- | --- |
| HMPPS Auth sign-in, sign-out and account-details stubs (`localhost:9091/auth/*`) | Synthetic pages owned by the authentication service. Sign-in helpers check completion without running Axe. |
| DPS, prisoner profiles, incentives, non-associations, video conference schedules, feedback and other external links | Pages owned by other applications. Smoke tests do not follow these links or run accessibility checks on them. |
| Digital Prison Reporting package pages | Externally maintained package UI, disabled by the feature environment; outside the application-owned template inventory. |
| Separate maintenance-page deployment (`maintenance_page/index.html`) | Served by its own nginx container, not by the application under test; requires deployment-level checks. |
| Development stack-trace variant of the generic error page | Deliberately displays diagnostic output. The **production** variant is included using the same built application with a local production-mode server. |
| Redirects, image/CSV downloads, health and JSON endpoints | Do not render application screens. Redirect destinations are inventoried. |

Review these boundaries when adding routes. They are documented scope decisions, not assertions that external approval or manual WCAG testing has happened.

## Running and maintaining

Start the existing Redis, WireMock and feature application as described in the root README, then:

```sh
npm run pw-test -- smoke
npm run pw-test -- --shard=1/2
npm run pw-test -- --shard=2/2
```

Do not run shards concurrently against the same application/WireMock instance. CI provides separate services for each shard and continues to discover smoke specs automatically through `playwright.config.ts`. Keep one worker per shard: stubs are shared. Specs are split by functional area so Playwright can distribute them across shards.

For a new full template:

1. Add a row to `screens.json` with a unique ID, functional area, view path, real route, stable expected h1 text, status and (where defined) page ID.
2. Add minimum representative journey data and API responses in the appropriate functional-area setup. Reuse existing fixtures/stubs. `:journeyId` and `:today` are expanded by the runner.
3. Register a new area with `smokeArea` if necessary. A documented exclusion needs a reason and reviewer agreement; never mark an unimplemented screen covered or disable Axe to make a test pass.
4. Run the affected area, regenerate the readable inventory with `node e2e/scripts/screen-inventory.mjs`, and review the diff.

The inventory test fails when a template is added/removed without updating the inventory, when rows are duplicated or incomplete, or when a covered area has no registered spec. The recorded page IDs additionally protect against accidental redirects to another screen with the same heading.

Each smoke case opens its real application route and calls the shared `expectPage(page, heading, true, 1)`. This verifies a visible expected h1, non-empty title, visible main content, no stack trace and Axe results. The existing baseline exceptions for `aria-allowed-attr` and `color-contrast` remain unchanged; this is not full WCAG or manual accessibility testing.

Authentication is reused within a worker, with separate browser contexts per test. API stubs reset for each test. Unique journey data is seeded in the local feature-test Redis store and removed in `finally`, with an expiry as a fallback. Video-link journeys use their existing session-data map. No test-only application routes or render mocks are introduced. The production error test starts/stops the built application on a spare local port with local API stubs; a build is required.

Tests should only assert rendering and accessibility. Keep form validation, writes, business rules, transformations and multi-step behaviour in existing journey, handler, service or view tests.

## Runtime and migration record

The runtime reporter writes `playwright-test-results/runtime.json` on every run, and a per-shard summary to `GITHUB_STEP_SUMMARY` in CI. Existing artifact uploads include this file. It records elapsed wall time and separate smoke/other test duration totals, test counts and attempts (including retries). Test-time sums are not the same as elapsed pipeline time: startup, worker restarts, browser installation, build and service setup also contribute.

See [runtime measurements](runtime.md) for local baseline and shard measurements. CI wall time and delivery-team acceptance must be checked on the PR; local results do not establish CI success.

Migration additions: the screen inventory supplements the existing journey migration; the shared page helper accepts an optional heading level, used by smoke tests to require an h1 while retaining existing journey confirmation-heading behaviour. The smoke sweep found and fixed missing primary headings in administration, missing search/date labels, empty allocation table headers, an incorrectly marked filter heading, an omitted attendance-table roles argument and a missing activity name in the deallocation heading. No new Axe exceptions were added.

Review/merge gates remain external: inventory and exclusion review, CI shard results, pipeline runtime acceptance, PR review and merge.
