# Telemetry

`server.ts` imports this directory’s `index.ts` first. It initialises Application
Insights before loading the logger and installing the HTTP diagnostics. The Redis client calls `redisConnectionDiagnostics.ts`
from its error listener. Tests and production queries live alongside the diagnostics.

## Production connection reset diagnostics

Loaded at server startup, after Azure telemetry initialisation. Bunyan warnings are
exported by the existing telemetry integration when
`APPLICATIONINSIGHTS_CONNECTION_STRING` is configured.

`outbound_http_connection_reset` records each Node HTTP/HTTPS attempt that fails
with ECONNRESET, even if the REST client subsequently retries successfully. It
also observes response stream resets. It does not alter retries or handle errors
on behalf of callers. Fetch/Undici requests are not covered.

Fields include host, method, sanitised endpoint, durationMs, reusedSocket,
responseStarted, requestFinished, socket state, socket lifetime byte counts, and
traceId/spanId when an active span is available. No request headers, bodies or
query strings are recorded. Addresses may be unavailable after socket teardown.

Redis errors have event `redis_connection_error`, errorCode, host, port, TLS and
client readiness fields. Existing reconnect messages report the backoff attempt.

In Application Insights Logs:

```
traces
| where timestamp > ago(24h)
| where message == "Outbound HTTP connection reset"
| extend host = tostring(customDimensions.host),
         endpoint = tostring(customDimensions.endpoint),
         reusedSocket = tostring(customDimensions.reusedSocket),
         responseStarted = tostring(customDimensions.responseStarted)
| summarize resets=count() by host, endpoint, reusedSocket, responseStarted, bin(timestamp, 15m)
| order by timestamp desc
```

For individual failures, remove the summary and inspect customDimensions; use
operation_Id (or explicit traceId) to correlate requests and dependencies. In a
workspace using AppTraces, the equivalents are TimeGenerated, Message,
Properties and OperationId.

A concentration on reused sockets suggests investigating keep-alive/idle timeout
mismatches. Resets on fresh connections or during responses warrant checking the
downstream service, ingress and network logs at the same time. These fields are
evidence, not proof of which peer closed the connection. Counts represent failed
attempts, not necessarily failed user requests, and telemetry sampling/export
can affect the observed totals.
