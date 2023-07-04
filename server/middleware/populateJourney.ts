import { RequestHandler } from 'express'
import { AppointmentSessionDatum } from '../@types/express'

const journeys = ['appointmentJourney', 'bulkAppointmentJourney', 'editAppointmentJourney']

export default function populateJourney(): RequestHandler {
  return async (req, res, next) => {
    // Will create a new session data map if the existing map is undefined or null
    req.session.appointmentSessionDataMap ??= new Map<string, AppointmentSessionDatum>()

    // This loop redefines the existing session properties, intercepting their getter and setters and replacing the
    // implementation with the usage of the session data map. In this way, we can have journey specific session data
    // without having to change the handlers or views. They remain unaware of this change but could in future use the
    // journeyId to prevent double posting or as a surrogate id for the entities. See startNewJourney.ts for where the
    // journeyId parameter comes from and how it is injected into the first url in the journey
    journeys.forEach(p => {
      Object.defineProperty(req.session, p, {
        get() {
          // Will return either the found, mapped, non-undefined session data journey or null
          return req.session.appointmentSessionDataMap[req.params.journeyId]?.[p] ?? null
        },
        set(value) {
          // Will create a new session datum if one is not mapped, or it is undefined or null
          req.session.appointmentSessionDataMap[req.params.journeyId] ??= {} as AppointmentSessionDatum
          req.session.appointmentSessionDataMap[req.params.journeyId][p] = value
        },
      })
    })

    next()
  }
}
