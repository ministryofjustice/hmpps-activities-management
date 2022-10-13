import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivityListRouteHandler from './handlers/ActivityListRouteHandler'
import SelectActivityLocationRouteHandler from './handlers/SelectActivityLocationRouteHandler'
import { Services } from '../../services'
import fetchActivityList from '../../middleware/fetchActivityList'
import ActivityListAbsencesRouteHandler from './handlers/ActivityListAbsencesRouteHandler'
import fetchAbsenceReasons from '../../middleware/fetchAbsenceReasons'

export default ({ prisonService }: Services): Router => {
  const router = Router()
  const getSelectActivityLocation = (path: string, handler: RequestHandler) =>
    router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const getActivityList = (path: string, handler: RequestHandler) =>
    router.get(path, fetchActivityList(prisonService), asyncMiddleware(handler))
  // const getActivityListAbsences = (path: string, handler: RequestHandler) =>
  //   router.get(path, fetchAbsenceReasons(prisonService), asyncMiddleware(handler))

  const selectActivityLocationRouteHandler = new SelectActivityLocationRouteHandler(prisonService)
  const activityListRouteHandler = new ActivityListRouteHandler(prisonService)
  const activityListAbsencesRouteHandler = new ActivityListAbsencesRouteHandler(prisonService)

  getSelectActivityLocation('/select-activity-location', selectActivityLocationRouteHandler.GET)
  post('/select-activity-location', selectActivityLocationRouteHandler.POST)
  getActivityList('/', activityListRouteHandler.GET)
  post('/', activityListRouteHandler.POST)
  // getActivityListAbsences('/absences', activityListAbsencesRouteHandler.GET)
  router.get(
    '/absences',
    fetchAbsenceReasons(prisonService),
    fetchActivityList(prisonService),
    asyncMiddleware(activityListAbsencesRouteHandler.GET),
  )
  router.post('/absences', fetchAbsenceReasons(prisonService), asyncMiddleware(activityListAbsencesRouteHandler.POST))
  return router
}
