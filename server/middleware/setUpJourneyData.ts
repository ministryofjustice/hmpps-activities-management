import { NextFunction, Request, Response } from 'express'
import { JourneyData } from '../@types/express'
import TokenStoreInterface from '../data/tokenStoreInterface'
import logger from '../../logger'

// Off by default for cypress tests to enable the many isolated page tests to work without mocking
// Enable this in test explicitly by injecting journeyData with stateGuard set to true
// const stateGuard = process.env.NODE_ENV !== 'e2e-test'

const isJourneyData = (value: unknown): value is JourneyData =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export default function setUpJourneyData(store: TokenStoreInterface) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const journeyId = (req.params.journeyId as string) ?? 'default'
    const journeyTokenKey = `journey.${req.user?.username}.${journeyId}`

    let cachedJourneyData: JourneyData | undefined

    try {
      const cached = await store.getToken(journeyTokenKey)
      const parsed = cached ? (JSON.parse(cached) as unknown) : undefined

      if (parsed !== undefined && !isJourneyData(parsed)) {
        throw new Error(`Cached journey data must be a JSON object`)
      }

      cachedJourneyData = parsed
    } catch (error) {
      logger.warn(error, `setUpJourneyData - Failed to read ${journeyTokenKey}`)
      next(error)
      return
    }

    req.journeyData = cachedJourneyData ?? req.journeyData ?? {}

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
