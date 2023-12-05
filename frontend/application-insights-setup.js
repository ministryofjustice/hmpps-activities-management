import { ApplicationInsights } from '@microsoft/applicationinsights-web'

if (window.applicationInsightsConnectionString) {
  const appInsights = new ApplicationInsights({
    config: {
      connectionString: window.applicationInsightsConnectionString,
    },
  })
  appInsights.addTelemetryInitializer(envelope => {
    envelope.tags['ai.cloud.role'] = window.applicationInsightsRoleName
  })
  appInsights.setAuthenticatedUserContext(window.authenticatedUser)
  appInsights.loadAppInsights()
  appInsights.trackPageView()

  initMetricClickEvents(appInsights)
}

function initMetricClickEvents(appInsights) {
  Array.from(document.querySelectorAll('[data-track-click-event]')).forEach(el => {
    if (!el.dataset.trackClickEvent) return

    el.addEventListener('click', () => {
      const name = el.dataset.trackClickEvent
      const properties = el.dataset.trackEventProperties ? JSON.parse(el.dataset.trackEventProperties) : undefined
      const measurements = el.dataset.trackEventMeasurements ? JSON.parse(el.dataset.trackEventMeasurements) : undefined

      appInsights.trackEvent({ name, properties, measurements })
    })
  })
}
