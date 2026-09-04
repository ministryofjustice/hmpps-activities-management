# Server request timing

This middleware provides an opt-in local timeline for diagnosing slow page requests. It builds on the application's structured logging and OpenTelemetry instrumentation, but local diagnosis does not require an Application Insights connection or access to production telemetry.

## Enable locally

Set the following environment variables:

```bash
SERVER_REQUEST_TIMING_ENABLED=true
SERVER_TIMING_HEADER_ENABLED=true # optional: to expose timings in browser developer tools
```

Restart the application after changing them. Both settings are forced off when `NODE_ENV=production`. When disabled, no request context is created and the shared REST client is not wrapped.

## Structured output

Each dynamic page request produces one `server_request_timing` log entry. For example (timings are illustrative):

```json
{
  "event": "server_request_timing",
  "request": {
    "method": "GET",
    "route": "/activities/attendance/:journeyId/activities/:id/attendance-list",
    "status": 200,
    "outcome": "completed",
    "durationMs": 184.7,
    "correlationId": "0af7651916cd43dd8448eb211c80319c"
  },
  "downstream": [
    {
      "sequence": 1,
      "concurrentWith": [],
      "duplicateIndex": 1,
      "service": "Activities Management API",
      "method": "GET",
      "endpoint": "/scheduled-instances/:id",
      "startMs": 21.4,
      "durationMs": 82.1,
      "status": 200,
      "connectionReused": false,
      "outcome": "completed"
    },
    {
      "sequence": 2,
      "concurrentWith": [1],
      "duplicateIndex": 1,
      "service": "Prisoner search API",
      "method": "POST",
      "endpoint": "/prisoner-search/prisoner-numbers",
      "startMs": 22,
      "durationMs": 91.3,
      "status": 200,
      "outcome": "completed"
    }
  ],
  "renders": [
    {
      "sequence": 3,
      "view": "pages/activities/record-attendance/attendance-list-single",
      "startMs": 116.2,
      "durationMs": 31.8,
      "outcome": "completed"
    }
  ]
}
```

## How to interpret the output

- `request.durationMs` is the total server-side duration. Compare it with the browser's waiting/TTFB time rather than summing every downstream duration.
- `sequence` is operation start order and `startMs` is measured from the start of the page request.
- Overlapping `startMs`/`durationMs` intervals are concurrent. `concurrentWith` explicitly identifies sibling calls that were already running when another call started; non-overlapping calls are serial.
- `parentSequence` associates nested work, such as an HMPPS Auth token request, with the outer API call.
- `duplicateIndex` greater than one identifies another call with the same service, method and sanitised endpoint during the request.
- `connectionReused` shows whether Node reused a keep-alive socket. Compare this with duration across cold, immediate repeat and post-idle requests. It is supporting evidence, not proof by itself, of connection-setup cost.
- `renders` isolates Express/Nunjucks rendering. A large gap not covered by downstream or render intervals points to other middleware, Redis, controller computation or response handling.
- Completed 4xx/5xx operations have `outcome: "failed"`. Work still active when a connection closes has `outcome: "aborted"`.
- `correlationId` identifies the request summary when capturing or comparing local evidence. It uses the active OpenTelemetry trace ID when available and otherwise falls back to a local UUID.

Durations for concurrent calls overlap, so adding every `durationMs` can exceed the total request duration. Look for the longest serial path through the intervals when deciding what controlled the response time.

## Browser inspection

With `SERVER_TIMING_HEADER_ENABLED=true`, open Chrome DevTools before loading the page, select **Network**, reload, and select the main request whose type is `document`. The response's **Headers** panel contains `Server-Timing`; the **Timing** panel shows `total`, `api-N` and `render-N` entries under Server Timing.

The response header is intentionally compact and may omit excess entries. The structured log remains the complete source for ordering, failures and aborted requests.

## Investigation workflow

For each target page, capture:

1. The first request after starting the application.
2. An immediate repeat.
3. Another request after at least five seconds idle.

Start with an authenticated, low-work page to establish the common frontend-components and middleware baseline. Then test representative allocation and attendance pages reached through the normal UI journeys. Compare the request total, downstream intervals, render interval, socket reuse and unattributed gaps across the three captures.

If the first or post-idle request is slow but the immediate repeat is fast, identify which dependency interval grew. Repeat against local WireMock and connected DEV services where available to separate application work from remote connection or service latency. Do not infer a connection-setup cause from total duration alone.

## Implementation details

### How it works

For each included request, the middleware:

1. Creates an `AsyncLocalStorage` context containing the request timer and correlation ID.
2. Records calls made through the shared HMPPS `RestClient`, including nested authentication calls.
3. Wraps Express rendering to record Nunjucks duration on the same timeline.
4. Emits one structured log when the response finishes, fails or closes prematurely.
5. Optionally adds a compact version to the local `Server-Timing` response header.

The `RestClient` prototype is wrapped once when the feature is enabled. The wrapper immediately delegates to the original methods when there is no active request timing context. REST responses are requested in raw form so their status and socket-reuse information can be recorded, then the original caller's body/raw return contract is restored.

### Privacy

Only method, service name, status, timing information and normalised routes are recorded. Query parameters, request bodies, headers, authentication tokens and raw URLs are never added to the timing output. Express route parameters and identifier-like downstream path segments are replaced before logging.

Keep sanitisation tests alongside any new downstream path shape that contains user-supplied or identifying values.

### Response lifecycle

The summary is emitted once for completed, failed and prematurely closed responses. Incomplete downstream or render operations are marked as aborted.

The optional response header is installed through `res.writeHead`. This is intentional: response compression commits headers before delegating to `res.end`, so adding the header from an `end` wrapper would be too late. The header is limited to complete entries within 4 KB; the structured log is the complete source for ordering and failures.

### Boundaries

Total duration covers the full middleware chain after health checks. Named downstream timings cover calls through the shared HMPPS `RestClient`, and render timings cover Express/Nunjucks rendering. Redis, controller computation and other middleware are included in the total but do not currently have named timing entries; they appear as gaps in the timeline.

Health checks, static assets and other known infrastructure routes are excluded. The feature is forced off when `NODE_ENV=production`.
