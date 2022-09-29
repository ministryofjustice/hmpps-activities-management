import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivityListRouteHandler from './handlers/activityListRouteHandler'
import SelectActivityLocationRouteHandler from './handlers/SelectActivityLocationRouteHandler'
import { Services } from '../../services'

export default ({ prisonService }: Services): Router => {
  const router = Router()
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const activityListRouteHandler = new ActivityListRouteHandler()
  const selectActivityLocationRouteHandler = new SelectActivityLocationRouteHandler(prisonService)

  get('/select-activity-location', selectActivityLocationRouteHandler.GET)
  get('/', activityListRouteHandler.GET)

  return router
}
