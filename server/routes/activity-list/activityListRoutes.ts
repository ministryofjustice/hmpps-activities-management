import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivityListRouteHandler from './handlers/ActivityListRouteHandler'
import SelectActivityLocationRouteHandler from './handlers/SelectActivityLocationRouteHandler'
import { Services } from '../../services'
import fetchActivityList from '../../middleware/fetchActivityList'

export default ({ prisonService }: Services): Router => {
  const router = Router()
  const getSelectActivityLocation = (path: string, handler: RequestHandler) =>
    router.get(path, asyncMiddleware(handler))
  const postSelectActivityLocation = (path: string, handler: RequestHandler) =>
    router.post(path, asyncMiddleware(handler))
  const getActivityList = (path: string, handler: RequestHandler) =>
    router.get(path, fetchActivityList(prisonService), asyncMiddleware(handler))

  const activityListRouteHandler = new ActivityListRouteHandler()
  const selectActivityLocationRouteHandler = new SelectActivityLocationRouteHandler(prisonService)

  getSelectActivityLocation('/select-activity-location', selectActivityLocationRouteHandler.GET)
  postSelectActivityLocation('/select-activity-location', selectActivityLocationRouteHandler.POST)
  getActivityList('/', activityListRouteHandler.GET)

  return router
}
