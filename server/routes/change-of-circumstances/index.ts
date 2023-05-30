import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ChangeOfCircumstanceRoutes from './handlers/changeOfCircumstanceRoutes'
import SelectPeriodForChangesRoutes, { TimePeriodForChanges } from './handlers/selectPeriodForChanges'
import validationMiddleware from '../../middleware/validationMiddleware'
import { Services } from '../../services'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const changeOfCircumstanceHandler = new ChangeOfCircumstanceRoutes(activitiesService, prisonService)
  const selectPeriodForChangesHandler = new SelectPeriodForChangesRoutes()

  get('/select-period', selectPeriodForChangesHandler.GET)
  post('/select-period', selectPeriodForChangesHandler.POST, TimePeriodForChanges)
  get('/view-changes', changeOfCircumstanceHandler.GET)
  post('/view-changes', changeOfCircumstanceHandler.POST)

  return router
}
