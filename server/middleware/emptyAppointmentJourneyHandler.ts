import type { Request, Response, NextFunction } from 'express'

export default function emptyAppointmentJourneyHandler(stepRequiresSession: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (stepRequiresSession && !req.session.appointmentJourney) {
      return res.redirect(`/appointments`)
    }
    return next()
  }
}
