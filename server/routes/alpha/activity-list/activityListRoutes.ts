import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import ActivityListRouteHandler from './handlers/activityListRouteHandler'
import SelectActivityLocationRouteHandler from './handlers/selectActivityLocationRouteHandler'
import { Services } from '../../../services'

export default ({ prisonService }: Services): Router => {
  const router = Router()

  const selectActivityLocation = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const selectActivityLocationRouteHandler = new SelectActivityLocationRouteHandler(prisonService)
  selectActivityLocation('/select-activity-location', selectActivityLocationRouteHandler.GET)

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const activityListRouteHandler = new ActivityListRouteHandler()
  get('/', activityListRouteHandler.GET)
  return router
}
