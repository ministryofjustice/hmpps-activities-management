import { TelemetryClient } from 'applicationinsights'

export default class AppInsightsService {
  constructor(private readonly appInsightsTelemetryClient?: TelemetryClient) {}

  trackEvent = (event: string, properties: { [key: string]: unknown } = {}): void => {
    this.appInsightsTelemetryClient?.trackEvent({ name: event, properties })
  }
}
