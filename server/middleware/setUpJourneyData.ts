import { NextFunction, Request, Response } from 'express'
import { performance } from 'perf_hooks'
import { JourneyData } from '../@types/express'
import TokenStoreInterface from '../data/tokenStoreInterface'
import config from '../config'
import logger from '../../logger'

// Off by default for cypress tests to enable the many isolated page tests to work without mocking
// Enable this in test explicitly by injecting journeyData with stateGuard set to true
// const stateGuard = process.env.NODE_ENV !== 'e2e-test'

export default function setUpJourneyData(store: TokenStoreInterface) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const journeyId = req.params.journeyId ?? 'default'
    const journeyTokenKey = `journey.${req.user?.username}.${journeyId}`

    const cached = await store.getToken(journeyTokenKey)

    req.journeyData = cached ? (JSON.parse(cached) as JourneyData) : (req.journeyData ?? {})

    if (req.journeyData) {
      Object.entries(req.journeyData).forEach(([key, value]) => {
        res.locals[key] = value
      })
    }

    res.prependOnceListener('finish', async () => {
      if (!req.journeyData) {
        await store.delToken(journeyTokenKey)
      } else {
        const start = performance.now()

        try {
          await store.setToken(
            journeyTokenKey,
            JSON.stringify(req.journeyData ?? {}),
            config.journeyDataTokenDurationHours * 60 * 60,
          )
        } catch (err) {
          logger.warn(`Redis save failed: ${err}`)
        } finally {
          const end = performance.now()
          logger.info(`Redis save took ${(end - start).toFixed(2)}ms`)
        }
      }
    })
    next()
  }
}
