import { Router } from 'express'
import EventEmitter from 'node:events'
import config from '../config'
import logger from '../../logger'
import TokenStoreInterface from '../data/tokenStoreInterface'

export default function renderInterceptor(store: TokenStoreInterface): Router {
  const router = Router({ mergeParams: true })
  const redisBus = new EventEmitter()

  router.use((req, res, next) => {
    const originalRender = res.render

    res.render = function handleRender(view, options?, callback?) {
      if (!req.journeyData) {
        logger.info('renderInterceptor - No journey data - not saving data to Redis')
        originalRender.call(this, view, options, callback)
        return
      }
      logger.info('renderInterceptor - Journey data exists - will be saved to Redis')
      const journeyId = req.params.journeyId ?? 'default'
      const journeyTokenKey = `journey.${req.user?.username}.${journeyId}`
      const json = JSON.stringify(req.journeyData ?? {})
      const size = json.length
      const start = performance.now()

      try {
        redisBus.once(journeyTokenKey, () => {
          const end = performance.now()
          logger.info(`renderInterceptor - Redis save took ${(end - start).toFixed(2)}ms for size ${size}`)
          originalRender.call(this, view, options, callback)
        })

        store.setTokenAndEmit(journeyTokenKey, json, config.journeyDataTokenDurationHours * 60 * 60, redisBus)
      } catch (err) {
        logger.warn(`renderInterceptor - Redis save failed: ${err}`)
      }
    }
    next()
  })

  return router
}
