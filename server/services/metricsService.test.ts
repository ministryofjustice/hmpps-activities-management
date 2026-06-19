import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import { ServiceUser } from '../@types/express'
import MetricsService from './metricsService'
import MetricsEvent from '../data/metricsEvent'

jest.mock('@ministryofjustice/hmpps-azure-telemetry', () => ({
  telemetry: {
    trackEvent: jest.fn(),
  },
}))

describe('Metrics Service', () => {
  const metricsService = new MetricsService()

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  it('trackEvent', () => {
    const event = new MetricsEvent('event-name', user)
    metricsService.trackEvent(event)
    expect(telemetry.trackEvent).toHaveBeenCalledWith(event.name, {
      ...event.properties,
      ...event.measurements,
    })
  })
})
