import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import CalendarSpikeRoutes from './handlers/calendarSpike'
import config from '../../config'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const calendarSpikeHandler = new CalendarSpikeRoutes(activitiesService)

  // Spike routes are only accessible when running locally or when feature toggle is provided
  router.use((req, res, next) =>
    process.env.NODE_ENV === 'production' && !config.spikesFeatureToggleEnabled
      ? next(createHttpError.NotFound())
      : next(),
  )

  get('/calendar-spike', calendarSpikeHandler.GET)
  get('/calendar-spike/search', calendarSpikeHandler.PRISONER_SEARCH)

  return router
}
