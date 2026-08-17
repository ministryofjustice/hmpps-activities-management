import type { Request, Response, NextFunction } from 'express'

export default function emptyEditAppointmentJourneyHandler(stepRequiresSession: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (stepRequiresSession && (!req.journeyData.appointmentJourney || !req.journeyData.editAppointmentJourney)) {
      return res.redirect(`/appointments/${req.params.appointmentId}`)
    }
    return next()
  }
}
