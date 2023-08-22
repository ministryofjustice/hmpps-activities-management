// eslint-disable-next-line import/prefer-default-export

interface TrackEventParams {
  eventName: string
  properties: Record<string, string>
  metrics: Record<string, number>
}

// eslint-disable-next-line import/prefer-default-export
export function trackEvent({ eventName, properties, metrics }: TrackEventParams): void {
  // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
  const appInsights = require('applicationinsights')
  if (appInsights && process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start()
    appInsights.defaultClient.trackEvent({ name: eventName, properties: { ...properties }, metrics })
  }
}
