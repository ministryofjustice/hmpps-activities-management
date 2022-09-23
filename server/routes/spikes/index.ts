import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import PrisonServiceSpikeRoutes from './handlers/prisonServiceSpike'
import { Services } from '../../services'

export default function Index({ prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const prisonServiceSpikeHandler = new PrisonServiceSpikeRoutes(prisonService)

  get('/spikes/prison-service-spike', prisonServiceSpikeHandler.GET)

  return router
}
