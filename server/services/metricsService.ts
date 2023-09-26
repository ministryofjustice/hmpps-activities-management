import { TelemetryClient } from 'applicationinsights'

type Event = {
  name: string
  properties?: Record<string, string | number>
  measurements?: Record<string, number>
}

export default class MetricsService {
  constructor(private readonly appInsightsClient: TelemetryClient) {}

  trackEvent(event: Event) {
    if (this.appInsightsClient) {
      this.appInsightsClient.trackEvent(event)
    }
  }
}
