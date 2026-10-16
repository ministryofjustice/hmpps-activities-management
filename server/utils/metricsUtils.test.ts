import { Request } from 'express'
import { initJourneyMetrics } from './metricsUtils'

describe('Metrics Utils', () => {
  describe('initJourneyMetrics', () => {
    let req: Request

    beforeEach(() => {
      req = {
        journeyData: {},
      } as unknown as Request
    })

    it('initialises journey metrics journeyData with source', () => {
      initJourneyMetrics(req, 'theSource')

      expect(req.journeyData.journeyMetrics).not.toBeNull()
      expect(Date.now() - req.journeyData.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.journeyData.journeyMetrics.source).toEqual('theSource')
    })

    it('initialises journey metrics session data without source', () => {
      initJourneyMetrics(req)

      expect(req.journeyData.journeyMetrics).not.toBeNull()
      expect(Date.now() - req.journeyData.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.journeyData.journeyMetrics.source).toBeUndefined()
    })
  })
})
