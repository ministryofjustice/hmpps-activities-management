import { RequestHandler } from 'express'

export default function syncJourneyDataToLocals(): RequestHandler {
  return (req, res, next) => {
    if (req.journeyData) {
      Object.entries(req.journeyData).forEach(([key, value]) => {
        res.locals[key] = value
      })
    }
    next()
  }
}
