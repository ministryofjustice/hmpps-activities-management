import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import PrisonServiceSpikeRoutes from './handlers/prisonServiceSpike'
import { Services } from '../../services'
import validationMiddleware from '../../middleware/validationMiddleware'
import ValidationSpikeRoutes, { ValidatedType } from './handlers/validationSpike'

export default function Index({ prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const prisonServiceSpikeHandler = new PrisonServiceSpikeRoutes(prisonService)
  const validationSpikeHandler = new ValidationSpikeRoutes()

  get('/spikes/prison-service-spike', prisonServiceSpikeHandler.GET)
  get('/spikes/validation-spike', validationSpikeHandler.GET)
  post('/spikes/validation-spike', validationSpikeHandler.POST, ValidatedType)
  get('/spikes/validation-spike/success', validationSpikeHandler.SUCCESS)

  return router
}
