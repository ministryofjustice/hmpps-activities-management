import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import SelectPeriodRoutes from './handlers/selectPeriod'

export default function Index(): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const selectPeriodHandler = new SelectPeriodRoutes()

  get('/select-period', selectPeriodHandler.GET)

  return router
}
