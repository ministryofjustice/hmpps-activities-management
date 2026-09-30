# Screen accessibility coverage

The [screen inventory](../../SCREEN_INVENTORY.md) records application pages by functional area, representative route, expected heading and coverage status. Its source, [screens.json](screens.json), drives 250 screen accessibility tests and documents the generic server error page exclusion. The inventory is a review aid: adding a template does not automatically require an inventory entry or an accessibility test. The existing detailed Playwright journeys remain separate.

## Scope and exclusions

A screen is a full application page template. A template shared by create/edit routes or several parameters needs one representative render, rather than a test for every state or validation error. Both templates are included when a handler can render different full pages. Partials, layouts, tabs and components are exercised within their owning page. The accessibility suite does not prove all controls, hidden panels, links or data transformations work.

| Excluded surface                                                                                                    | Reason                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HMPPS Auth sign-in, sign-out and account-details stubs (`localhost:9091/auth/*`)                                    | Synthetic pages owned by the authentication service. Sign-in helpers check completion without running Axe.                                             |
| DPS, prisoner profiles, incentives, non-associations, video conference schedules, feedback and other external links | Pages owned by other applications. Accessibility tests do not follow these links or run accessibility checks on them.                                          |
| Digital Prison Reporting package pages                                                                              | Externally maintained package UI, disabled by the feature environment; outside the application-owned template inventory.                               |
| Separate maintenance-page deployment (`maintenance_page/index.html`)                                                | Served by its own nginx container, not by the application under test; requires deployment-level checks.                                                |
| Generic server error page (`pages/error.njk`)                                                                       | The feature application deliberately displays diagnostic stack traces. Testing the production variant would require a separate production-mode server. |
| Redirects, image/CSV downloads, health and JSON endpoints                                                           | Do not render application screens. Redirect destinations are inventoried.                                                                              |

Review these boundaries when adding routes. They are documented scope decisions, not assertions that external approval or manual WCAG testing has happened.

## Running locally

Build the application and start Redis, WireMock and the feature application as described in the [root README](../../../README.md). Run all Playwright tests with:

```sh
npm run pw-test
```

To run only the accessibility suite:

```sh
npm run pw-test -- --project=accessibility
```

To run one functional area:

```sh
npm run pw-test -- --project=accessibility accessibility/administration.spec.ts
```

## CI

The pipeline runs three jobs in parallel: two journey shards and one complete accessibility suite. Each job has its own application, Redis and WireMock services and uploads a separate Playwright report. A failure in one job does not cancel the others. All three must pass before deployment. Local runs do not need sharding.

## Maintaining coverage

When adding or updating accessibility coverage:

1. Add a row to `screens.json` with a unique ID, functional area, view path, real route, stable expected h1 text, status and (where defined) page ID.
2. Add minimum representative journey data and API responses in the appropriate functional-area setup. Reuse existing fixtures/stubs. `:journeyId` and `:today` are expanded by the runner.
3. Register a new area with `accessibilityArea` if necessary. Record the reason for any exclusion; never mark an unimplemented screen covered or disable Axe to make a test pass.
4. Run the affected area, regenerate the readable inventory with `node e2e/scripts/screen-inventory.mjs`, and review the diff.

There is no automated comparison between templates and the inventory. Review coverage as part of normal code review. Existing accessibility tests still fail for rendering or accessibility regressions on covered screens. The recorded page IDs additionally protect against accidental redirects to another screen with the same heading.

Each accessibility case opens its real application route and calls the shared `expectPage(page, heading, true, 1)`. This verifies a visible expected h1, non-empty title, visible main content, no stack trace and Axe results. The existing baseline exceptions for `aria-allowed-attr` and `color-contrast` remain unchanged; this is not full WCAG or manual accessibility testing.

Authentication is reused within a worker, with separate browser contexts per test. API stubs reset for each test. Unique journey data is seeded in the local feature-test Redis store and removed in `finally`, with an expiry as a fallback. Video-link journeys use their existing session-data map. No test-only application routes or render mocks are introduced.

Tests should only assert rendering and accessibility. Keep form validation, writes, business rules, transformations and multi-step behaviour in existing journey, handler, service or view tests.
