import { RequestHandler } from 'express'
import { AppointmentSessionDatum } from '../@types/express'

export default function populateJourney(): RequestHandler {
  return async (req, res, next) => {
    req.session.appointmentSessionDataMap ??= new Map<string, AppointmentSessionDatum>()

    const { journeyId } = req.params
    if (journeyId) {
      const appointmentSessionData = req.session.appointmentSessionDataMap[journeyId]
      req.session.appointmentJourney = appointmentSessionData?.appointmentJourney
      req.session.bulkAppointmentJourney = appointmentSessionData?.bulkAppointmentJourney
      req.session.editAppointmentJourney = appointmentSessionData?.editAppointmentJourney
    } else {
      req.session.appointmentJourney = null
      req.session.bulkAppointmentJourney = null
      req.session.editAppointmentJourney = null
    }

    next()
  }
}
