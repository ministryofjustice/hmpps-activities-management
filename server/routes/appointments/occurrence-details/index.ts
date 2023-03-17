import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import OccurrenceDetailsRoutes from './handlers/occurrenceDetails'
import OccurrenceMovementSlipRoutes from './handlers/occurrenceMovementSlip'
import { Services } from '../../../services'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const occurrenceDetailsHandler = new OccurrenceDetailsRoutes(activitiesService)
  const occurrenceMovementSlipHandler = new OccurrenceMovementSlipRoutes(activitiesService)

  get('/:id', occurrenceDetailsHandler.GET)
  get('/movement-slip/:id', occurrenceMovementSlipHandler.GET)

  return router
}
