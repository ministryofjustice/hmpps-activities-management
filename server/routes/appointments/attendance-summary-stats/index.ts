import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'
import DashboardRoutes from './handlers/dashboard'

export default function Index(): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectDateRoutes = new SelectDateRoutes()
  const dashboardRoutes = new DashboardRoutes()

  get('/select-date', selectDateRoutes.GET)
  post('/select-date', selectDateRoutes.POST, SelectDate)
  get('/dashboard', dashboardRoutes.GET)

  return router
}
