# Scope and implementation

- Follow existing feature patterns, dependency injection, utilities and components. Use the repository's ESLint, Prettier and TypeScript configuration.
- Keep changes and investigation focused on the requested behaviour and affected tests. Inspect relevant consumers of shared code; expand only for concrete dependencies, changed contracts or plausible regressions.
- Follow the existing feature's split between route handlers, services and API clients. Handlers live in `server/routes`, services in `server/services`, API clients in `server/data` and templates in `server/views`.
- Reuse types in `server/@types`. Some are handwritten; regenerate OpenAPI declarations with the corresponding `generate-*-types.sh` script where available and inspect the diff. Do not hand-edit generated declarations or build output in `dist`.

# Forms, journeys and defensive coding

- Follow existing `class-transformer`/`class-validator` models and `validationMiddleware`. Preserve submitted values, accessible error messages and error-summary links using existing GOV.UK and MOJ components.
- Use the feature's journey middleware and typed model (often `req.journeyData`). Preserve initialisation, back/change-answer navigation, redirects, cleanup and recovery from missing, expired or incomplete state.
- Reuse date utilities; distinguish date-only values from timestamps and account for relevant boundary dates and timezone effects.
- Preserve authorisation, active prison/caseload scoping and CSRF protection.
- Validate external input at application boundaries using established mechanisms. Keep checks proportionate to actual contracts; avoid duplicating them internally.
- Before mutations, account for stale data, changed eligibility and repeated submissions rather than relying solely on checks from an earlier page.
- Distinguish valid empty results from downstream failures. Handle expected failures explicitly and let unexpected ones reach the established error handler. Do not conceal invalid state with defaults, optional chaining or type assertions.
- Keep useful diagnostic context without logging credentials, tokens or sensitive prisoner data. Never include secrets or real prisoner data in code or fixtures.

# Testing and verification

- Read affected tests and relevant coverage at other layers before adding tests. Extend existing suites and reuse fixtures, helpers and mocking conventions.
- Test each behaviour at the lowest layer that proves it reliably: unit tests for rules, validation and handlers/services; integration tests for boundaries and wiring; Playwright for critical journeys and browser-specific behaviour. Duplicate coverage only when it addresses a distinct risk.
- Jest tests generally sit beside source files as `*.test.ts`. Playwright tests live in `e2e/playwright`, with shared WireMock stubs and fixtures in `integration_tests`.
- Test observable behaviour, including relevant edge and failure cases. For mutations, check API arguments and that invalid or unauthorised requests cannot trigger writes. Add a regression test for bug fixes.
- Review Playwright coverage for journey, form, navigation and browser changes. Cover meaningful flows and relevant validation, retained values and accessibility behaviour. Reuse page objects, prefer role/label locators and use retrying assertions instead of fixed sleeps.
- Keep tests deterministic and independent of live APIs: control time where needed, isolate data and reset mocks/stubs. Do not mock away the behaviour under test.
- Investigate contradictory expectations and failures. Update obsolete coverage when behaviour changes, explaining removals; do not weaken assertions, skip tests or increase timeouts merely to pass a suite.
- Run new and existing affected tests together, including relevant shared-code consumers. Broaden verification when impact or focused-test failures justify it; run lint, typechecking and build checks as appropriate.
- Use `package.json` for commands and runtime versions, and `README.md` for setup. Report checks actually run, their results, added coverage and any checks not run or remaining gaps. Claim success only for checks executed successfully.

# Code review and follow-ups

- Report actionable correctness, security, accessibility and regression issues introduced or materially worsened by the change. Explain the triggering scenario and impact; identify pre-existing issues only when they block correctness.
- Apply the safeguards and testing guidance above to the changed behaviour, especially prison scoping, journey state, dates, mutations and API contracts.
- Leave formatting to tooling. Keep concrete improvement suggestions in changed files separate as optional follow-ups; do not seek out or implement unrelated hardening, refactoring or technical debt work.
