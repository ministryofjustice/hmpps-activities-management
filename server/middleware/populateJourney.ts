import { RequestHandler } from 'express'
import { AppointmentSessionDatum } from '../@types/express'

const journeys = ['appointmentJourney', 'bulkAppointmentJourney', 'editAppointmentJourney']

export default function populateJourney(): RequestHandler {
  return async (req, res, next) => {
    req.session.appointmentSessionDataMap ??= new Map<string, AppointmentSessionDatum>()

    journeys.forEach(p => {
      Object.defineProperty(req.session, p, {
        get() {
          return req.session.appointmentSessionDataMap[req.params.journeyId]?.[p]
        },
        set(value) {
          req.session.appointmentSessionDataMap[req.params.journeyId] ??= {} as AppointmentSessionDatum
          req.session.appointmentSessionDataMap[req.params.journeyId][p] = value
        },
      })
    })

    next()
  }
}
