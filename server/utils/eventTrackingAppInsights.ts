// eslint-disable-next-line import/prefer-default-export

// eslint-disable-next-line import/prefer-default-export
export function trackEvent(eventName: string, properties: Record<string, string>): void {
  // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
  const appInsights = require('applicationinsights')
  if (appInsights && process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start()
    appInsights.defaultClient.trackEvent({ name: eventName, properties: { ...properties } })
  }
}
