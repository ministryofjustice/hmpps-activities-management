import type { Request, Response, NextFunction } from 'express'

export default function emptyJourneyHandler(journeyName: string, stepRequiresSession: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (stepRequiresSession && !req.session[journeyName]) {
      return res.redirect('/')
    }
    return next()
  }
}
