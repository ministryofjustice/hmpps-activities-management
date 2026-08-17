import { NextFunction, Request, Response } from 'express'
import { JourneyData } from '../@types/express'
import TokenStoreInterface from '../data/tokenStoreInterface'
import logger from '../../logger'

// Off by default for cypress tests to enable the many isolated page tests to work without mocking
// Enable this in test explicitly by injecting journeyData with stateGuard set to true
// const stateGuard = process.env.NODE_ENV !== 'e2e-test'

type SetUpJourneyDataOptions = {
  preserveLegacyAppointmentJourney?: boolean
}

const isJourneyData = (value: unknown): value is JourneyData =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export default function setUpJourneyData(store: TokenStoreInterface, options: SetUpJourneyDataOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const journeyId = (req.params.journeyId as string) ?? 'default'
    const journeyTokenKey = `journey.${req.user?.username}.${journeyId}`

    let cachedJourneyData: JourneyData | undefined
    let cacheReadError: unknown
    let cacheReadFailed = false

    try {
      const cached = await store.getToken(journeyTokenKey)
      const parsed = cached ? (JSON.parse(cached) as unknown) : undefined

      if (parsed !== undefined && !isJourneyData(parsed)) {
        throw new Error(`Cached journey data must be a JSON object`)
      }

      cachedJourneyData = parsed
    } catch (error) {
      cacheReadFailed = true
      cacheReadError = error
      logger.warn(error, `setUpJourneyData - Failed to read ${journeyTokenKey}`)
    }

    const legacyAppointmentJourney = options.preserveLegacyAppointmentJourney
      ? req.session.sessionDataMap?.[journeyId]?.appointmentJourney
      : undefined

    // During the appointment migration, the legacy session copy is safe to use as a recovery source.
    if (cacheReadFailed && !legacyAppointmentJourney) {
      next(cacheReadError)
      return
    }

    req.journeyData = cachedJourneyData ?? req.journeyData ?? {}

    if (options.preserveLegacyAppointmentJourney) {
      const cacheContainsAppointmentJourney = Object.hasOwn(req.journeyData, 'appointmentJourney')
      const appointmentJourney = cacheContainsAppointmentJourney
        ? req.journeyData.appointmentJourney
        : legacyAppointmentJourney

      if (appointmentJourney !== undefined) {
        req.session.appointmentJourney = appointmentJourney
      }

      // Dual-write for one rollout so old and new application instances can both continue the same journey.
      Object.defineProperty(req.journeyData, 'appointmentJourney', {
        configurable: true,
        enumerable: true,
        get: () => req.session.appointmentJourney,
        set: value => {
          req.session.appointmentJourney = value
        },
      })
    }

    if (req.journeyData) {
      Object.entries(req.journeyData).forEach(([key, value]) => {
        res.locals[key] = value
      })
    }

    res.prependOnceListener('finish', async () => {
      if (!req.journeyData) {
        await store
          .delToken(journeyTokenKey)
          .catch(error => logger.warn(error, `setUpJourneyData - Failed to delete ${journeyTokenKey}`))
      }
    })

    next()
  }
}
