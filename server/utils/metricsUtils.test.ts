import { Request } from 'express'
import { initJourneyMetrics } from './metricsUtils'

describe('Metrics Utils', () => {
  describe('initJourneyMetrics', () => {
    let req: Request

    beforeEach(() => {
      req = {
        session: {},
      } as unknown as Request
    })

    it('initialises journey metrics session data with source', () => {
      initJourneyMetrics(req, 'theSource')

      expect(req.session.journeyMetrics).not.toBeNull()
      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toEqual('theSource')
    })

    it('initialises journey metrics session data without source', () => {
      initJourneyMetrics(req)

      expect(req.session.journeyMetrics).not.toBeNull()
      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()
    })
  })
})
