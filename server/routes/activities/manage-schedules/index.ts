import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import CheckPayRoutes from './handlers/checkPay'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const checkPayRouteHandler = new CheckPayRoutes(services.activitiesService, services.prisonService)
  router.get('/check-pay', asyncMiddleware(checkPayRouteHandler.GET))
  return router
}
