# Repository context

This is the HMPPS frontend for managing prison activities and appointments.
It uses TypeScript, Express, Nunjucks, GOV.UK Frontend and MOJ Frontend.
Redis supports sessions, journey state and token caching.

Follow existing patterns in the relevant feature before introducing new ones.
Keep changes focused on the requested behaviour.

# Architecture and implementation

- Route registration and request handlers live in server/routes.
- Business logic and orchestration belong in server/services.
- Downstream HTTP calls belong in server/data API clients. Reuse existing
  clients and their authentication and error-handling conventions.
- Nunjucks templates live in server/views. Reuse existing macros and GOV.UK
  and MOJ components, including accessible form and error patterns.
- Follow the local dependency-injection pattern through service factories
  and handler constructors.
- Reuse existing utilities, validators, enums and dependencies before adding
  equivalents.
- Follow the repository's ESLint, Prettier and TypeScript configuration.

# Forms and journeys

- Follow the feature's existing class-transformer/class-validator models
  and validationMiddleware pattern for form validation.
- Preserve submitted values, useful error messages and error-summary links
  when changing forms.
- Follow the feature's journey middleware and typed journey model.
  Many journeys use req.journeyData; check the surrounding implementation
  before introducing separate session state.
- Preserve journey initialisation, back navigation, change-answer navigation,
  redirects and cleanup behaviour.
- Handle missing, expired or incomplete journey state using the established
  recovery behaviour.
- Use existing date parsing and formatting utilities. Distinguish date-only
  values from timestamps and consider boundary dates and timezone effects.
- Preserve authorisation, active prison/caseload scoping and CSRF protection.

# Defensive coding

- Validate external input at application boundaries, including route
  parameters, query strings, form submissions and downstream API data.
  Reuse established validation mechanisms.
- Consider stale data, changed eligibility and repeated submissions before
  performing mutations. Do not assume a previous page's checks still hold.
- Distinguish valid empty results from downstream failures. Do not silently
  turn errors into empty lists, success responses or misleading defaults.
- Handle expected failures explicitly and allow unexpected failures to reach
  the established error handler.
- Preserve useful diagnostic context without logging credentials, tokens
  or sensitive prisoner data.
- Use optional chaining and fallback values only when absence is valid.
  Do not hide broken assumptions with defaults, type assertions or non-null
  assertions.
- Keep defensive checks proportionate to actual contracts and failure modes.
  Avoid duplicating validation throughout internal layers.
- Never include credentials, tokens or real prisoner data in code or fixtures.

# Types and generated files

- Reuse existing API types under server/@types.
- Do not hand-edit generated OpenAPI declarations. Use the corresponding
  generate-*-types.sh script when regeneration is required and inspect
  the resulting diff.
- Some files under server/@types are handwritten application types.
  Check the file before treating it as generated.
- Edit source files rather than generated build output in dist.

# Testing pyramid

- Apply the testing pyramid deliberately: use many focused unit tests,
  fewer integration tests and a small set of high-value Playwright journeys.
- Test each behaviour at the lowest layer that can prove it reliably.
- Use unit tests for business rules, validation, transformations and
  individual handler or service behaviour.
- Use integration tests to verify component boundaries and wiring.
- Use Playwright for critical user journeys and behaviour requiring a browser.
  Classify tests by what they exercise, not just the framework they use.
- Avoid repeating every business-rule permutation across multiple layers.
  Overlap should address a distinct risk at each layer.
- Choose coverage based on behavioural risk rather than test counts or
  coverage percentages alone.

# Existing coverage and regression testing

Before adding or changing tests:

- Read existing tests for the affected behaviour, including relevant coverage
  at other layers and tests for callers of changed shared code.
- Compare proposed tests with existing coverage. Identify the new risk,
  regression or missing scenario each test addresses.
- Extend existing suites and reuse fixtures and helpers where appropriate,
  rather than creating parallel coverage for the same behaviour.
- Check that new expectations agree with existing tests and the intended
  requirements. Investigate contradictions instead of changing assertions
  merely to match the implementation.
- When behaviour intentionally changes, update superseded expectations while
  preserving coverage for behaviour that must remain unchanged.
- Do not remove, weaken or replace existing coverage unless it is demonstrably
  redundant or obsolete. Explain the reason.
- For bug fixes, add a regression test that would fail with the original bug
  and pass with the fix.

Run new and existing affected tests together. Include relevant callers and
consumers of shared code to check for regressions and test interference.

# Test quality and thoroughness

- Jest tests generally live beside source files as *.test.ts.
- For each behavioural change, identify the happy path, relevant edge cases
  and failure paths.
- Test observable behaviour rather than reproducing implementation logic.
  Tests should fail if the intended behaviour is broken.
- Cover relevant boundary dates, empty results, invalid input, missing journey
  state, downstream failures and access restrictions.
- For mutations, assert important API arguments and verify that invalid
  or unauthorised requests cannot trigger a write.
- Reuse existing fixtures and mocking conventions. Mock at the appropriate
  boundary without mocking away the behaviour being tested.
- Keep tests independent of live APIs and real prisoner data.
- Keep tests deterministic: control time where necessary, isolate test data
  and reset mocks and stubs between tests.
- Do not weaken assertions, skip tests or increase timeouts merely to make
  a failing suite pass. Investigate the cause.

# Playwright coverage

- Playwright tests live in e2e/playwright. Shared WireMock stubs and fixtures
  live in integration_tests.
- Review Playwright coverage when changing a user journey, form interaction,
  navigation or browser-side behaviour. Add or update scenarios where they
  address an integration or browser-specific risk.
- Exercise complete meaningful flows, including submission, confirmation
  and the resulting state or downstream request where practical.
- Include relevant validation errors, retained form values, back navigation
  and change-answer flows without duplicating exhaustive unit-test cases.
- Reuse existing page objects, helpers, fixtures and WireMock conventions.
- Prefer accessible role and label locators where practical. Avoid brittle
  selectors tied to incidental markup.
- Use Playwright's waiting and retrying assertions rather than fixed sleeps.
- Keep scenarios independent and compatible with the shared WireMock setup.
- Check relevant accessibility behaviour, including labels, error-summary
  links and keyboard interaction.

# Commands and verification

Use package.json as the source of truth for commands and runtime versions.

- npm run lint
- npm run typecheck
- npm test -- --runTestsByPath <path-to-test>
- npm test
- npm run build
- npm run pw-test -- <spec-path>
  Requires the feature app and its dependencies to be running.
- npm run pw-test:local:no-pull
  Starts the local test stack using existing Docker images.

Run focused tests during development, then the relevant broader suites before
completing the change. Run lint, typechecking and build checks as appropriate.
Consult README.md for environment setup.

When reporting verification:

- Explain which testing layers cover the change and why.
- Summarise the additional coverage relative to existing tests.
- Report the checks actually run and their results.
- State any checks not run, blockers and remaining coverage gaps.
- Do not claim tests passed unless they were executed successfully.

# Code review

- Prioritise actionable correctness, security, accessibility and regression
  issues. Explain the triggering scenario and its impact.
- Pay particular attention to prison scoping, journey state, date boundaries,
  validation, repeated submissions and API request/response contracts.
- Assess defensive coding against realistic failure modes. Flag silent
  failures and defaults that conceal invalid state.
- Compare new and changed tests with existing coverage. Flag missing
  regression cases, contradictory expectations, weakened assertions and
  unnecessary duplication across testing layers.
- Check that tests exercise the changed behaviour and relevant failure cases
  at the appropriate level of the testing pyramid.
- Use ESLint and Prettier configuration for formatting conventions.
  Avoid subjective style comments already covered by tooling.
