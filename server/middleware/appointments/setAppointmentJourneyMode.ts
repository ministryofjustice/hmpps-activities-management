import { RequestHandler } from 'express'
import { AppointmentJourneyMode } from '../../routes/appointments/create-and-edit/appointmentJourney'

export default (mode: AppointmentJourneyMode): RequestHandler => {
  return (req, res, next) => {
    if (req.session.appointmentJourney) {
      req.session.appointmentJourney.mode = mode
    }

    return next()
  }
}
