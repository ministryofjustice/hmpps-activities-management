import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'

type Event = {
  name: string
  properties?: Record<string, string | number>
  measurements?: Record<string, number>
}

export default class MetricsService {
  trackEvent(event: Event) {
    const attributes = {
      ...event.properties,
      ...event.measurements,
    }

    if (Object.keys(attributes).length > 0) {
      telemetry.trackEvent(event.name, attributes)
      return
    }

    telemetry.trackEvent(event.name)
  }
}
