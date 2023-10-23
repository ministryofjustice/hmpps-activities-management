import { RequestHandler } from 'express'
import { SessionDatum } from '../@types/express'

const journeys = [
  'appointmentJourney',
  'appointmentSetJourney',
  'attendanceSummaryJourney',
  'createJourney',
  'allocateJourney',
  'editAppointmentJourney',
  'journeyMetrics',
  'unlockListJourney',
  'waitListApplicationJourney',
]
const MAX_CONCURRENT_JOURNEYS = 100

export default function populateJourney(): RequestHandler {
  return async (req, res, next) => {
    // Will create a new session data map if the existing map is undefined or null
    req.session.sessionDataMap ??= new Map<string, SessionDatum>()

    // This loop redefines the existing session properties, intercepting their getter and setters and replacing the
    // implementation with the usage of the session data map. In this way, we can have journey specific session data
    // without having to change the handlers or views. They remain unaware of this change but could in future use the
    // journeyId to prevent double posting or as a surrogate id for the entities. See startNewJourney.ts for where the
    // journeyId parameter comes from and how it is injected into the first url in the journey
    journeys.forEach(p => {
      Object.defineProperty(req.session, p, {
        get() {
          // Will return either the found, mapped, non-undefined session data journey or null
          const journeyId = req.params.journeyId ?? 'default'
          return req.session.sessionDataMap[journeyId]?.[p] ?? null
        },
        set(value) {
          // Will create a new session datum if one is not mapped, or it is undefined or null
          const journeyId = req.params.journeyId ?? 'default'
          req.session.sessionDataMap[journeyId] ??= { instanceUnixEpoch: Date.now() } as SessionDatum
          req.session.sessionDataMap[journeyId][p] = value

          if (Object.keys(req.session.sessionDataMap).length > MAX_CONCURRENT_JOURNEYS) {
            const oldestKey = Object.keys(req.session.sessionDataMap).reduce((key, v) =>
              req.session.sessionDataMap[v].instanceUnixEpoch < req.session.sessionDataMap[key].instanceUnixEpoch
                ? v
                : key,
            )

            delete req.session.sessionDataMap[oldestKey]
          }
        },
      })
    })

    next()
  }
}
