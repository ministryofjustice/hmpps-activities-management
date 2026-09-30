# Smoke suite validation and runtime

Measured locally on 30 September 2026 with macOS 26.7, Node 24.2.0, Playwright Chromium, one worker per shard, and the existing feature application, Redis and WireMock services. Shards ran sequentially because they shared local services. All runs used the list and runtime reporters, without retries.

The baseline selects the existing `activities/`, `appointments/` and `helpers/` specs. The complete suite uses normal test discovery, including smoke specs and the inventory guard.

| Run | Shard | Existing/guard tests | Smoke tests | Elapsed | Result |
| --- | --- | ---: | ---: | ---: | --- |
| Existing suite | 1/2 | 19 | 0 | 137.2s | Passed |
| Existing suite | 2/2 | 16 | 0 | 99.9s | Passed |
| Complete suite | 1/2 | 36 | 137 | 300.5s | Passed |
| Complete suite | 2/2 | 0 | 114 | 70.1s | Passed |

All 287 tests passed across the complete shards: 251 screen smoke tests, one inventory guard and 35 existing tests. The smoke checks include baseline Axe checks. Build, typecheck, repository lint and the four affected view-test suites (15 tests) also passed.

Summed smoke test execution was 110.8s. Using the slowest local shard as an estimate of the parallel test-stage critical path gives 137.2s before and 300.5s after: an increase of 163.2s (119%). This is a single local comparison, not a measurement of hosted CI pipeline duration. Dependency installation, build and service startup are excluded.

The current default sharding distributes test groups without accounting for duration. Adding many short smoke cases places all existing journey tests in shard 1, producing a substantial imbalance. If this cost is unacceptable on CI, review shard allocation using hosted measurements before accepting the runtime impact.

Reproduction (after starting feature-test services):

```sh
npm run pw-test -- activities/ appointments/ helpers/ --shard=1/2 --reporter=list,./e2e/playwright/smoke/support/runtimeReporter.ts
npm run pw-test -- activities/ appointments/ helpers/ --shard=2/2 --reporter=list,./e2e/playwright/smoke/support/runtimeReporter.ts
npm run pw-test -- --shard=1/2 --reporter=list,./e2e/playwright/smoke/support/runtimeReporter.ts
npm run pw-test -- --shard=2/2 --reporter=list,./e2e/playwright/smoke/support/runtimeReporter.ts
```

Preserve `playwright-test-results/runtime.json` between runs because the next run clears the output directory. CI writes separate artifact reports and job summaries per shard automatically.

Hosted CI results, inventory/exclusion review, delivery-team runtime acceptance, PR review and merge remain pending. Local passing results do not satisfy those external review gates.
