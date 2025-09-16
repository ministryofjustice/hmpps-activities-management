import { Router } from 'express'
import EventEmitter from 'node:events'
import config from '../config'
import logger from '../../logger'
import TokenStoreInterface from '../data/tokenStoreInterface'

export default function redirectInterceptor(store: TokenStoreInterface): Router {
  const router = Router({ mergeParams: true })
  const redisBus = new EventEmitter()

  router.use((req, res, next) => {
    const originalRedirect = res.redirect

    res.redirect = function handler(url) {
      if (!req.journeyData) {
        logger.info('redirectInterceptor - No journey data - not saving data to Redis')
        originalRedirect.call(this, url)
      } else {
        logger.info('redirectInterceptor - Journey data exists - will be saved to Redis')
        const journeyId = req.params.journeyId ?? 'default'
        const journeyTokenKey = `journey.${req.user?.username}.${journeyId}`
        const json = JSON.stringify(req.journeyData ?? {})
        const size = json.length
        const start = performance.now()

        try {
          redisBus.once(journeyTokenKey, () => {
            const end = performance.now()
            logger.info(`redirectInterceptor - Redis save took ${(end - start).toFixed(2)}ms for size ${size}`)
            originalRedirect.call(this, url)
          })

          store.setTokenAndEmit(journeyTokenKey, json, config.journeyDataTokenDurationHours * 60 * 60, redisBus)
        } catch (err) {
          logger.warn(`redirectInterceptor - Redis save failed: ${err}`)
        }
      }
    }
    next()
  })

  return router
}
