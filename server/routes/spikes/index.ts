import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import CalendarSpikeRoutes from './handlers/calendarSpike'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const calendarSpikeHandler = new CalendarSpikeRoutes(activitiesService)

  get('/calendar-spike', calendarSpikeHandler.GET)
  get('/calendar-spike/search', calendarSpikeHandler.PRISONER_SEARCH)

  return router
}
