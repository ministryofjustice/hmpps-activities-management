import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import OccurrenceDetailsRoutes from './handlers/occurrenceDetails'
import OccurrenceMovementSlipRoutes from './handlers/occurrenceMovementSlip'

export default function Index(): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const occurrenceDetailsHandler = new OccurrenceDetailsRoutes()
  const occurrenceMovementSlipHandler = new OccurrenceMovementSlipRoutes()

  get('/', occurrenceDetailsHandler.GET)
  get('/movement-slip', occurrenceMovementSlipHandler.GET)

  return router
}
