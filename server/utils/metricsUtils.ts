import { Request } from 'express'

// eslint-disable-next-line import/prefer-default-export
export function initJourneyMetrics(req: Request, source?: string) {
  req.journeyData.journeyMetrics = {
    journeyStartTime: Date.now(),
    source,
  }
}
