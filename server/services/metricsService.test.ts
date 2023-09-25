import { TelemetryClient } from 'applicationinsights'
import { ServiceUser } from '../@types/express'
import MetricsService from './metricsService'
import MetricsEvent from '../data/MetricsEvent'

jest.mock('applicationinsights')

describe('Metrics Service', () => {
  const telemetryClient = new TelemetryClient()
  const metricsService = new MetricsService(telemetryClient)

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  it('trackEvent', () => {
    const event = new MetricsEvent('event-name', user)
    metricsService.trackEvent(event)
    expect(telemetryClient.trackEvent).toHaveBeenCalledWith(event)
  })
})
