import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import PrisonServiceSpikeRoutes from './handlers/prisonServiceSpike'
import { Services } from '../../services'
import CalendarSpikeRoutes from './handlers/calendarSpike'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const prisonServiceSpikeHandler = new PrisonServiceSpikeRoutes(prisonService)
  const calendarSpikeHandler = new CalendarSpikeRoutes(activitiesService)

  get('/prison-service-spike', prisonServiceSpikeHandler.GET)
  get('/calendar-spike', calendarSpikeHandler.GET)

  return router
}
