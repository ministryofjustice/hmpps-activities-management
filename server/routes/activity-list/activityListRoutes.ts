import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivityListRouteHandler from './handlers/ActivityListRouteHandler'
import SelectActivityLocationRouteHandler from './handlers/SelectActivityLocationRouteHandler'
import { Services } from '../../services'
import fetchActivityList from '../../middleware/fetchActivityList'
import fetchAbsenceReasons from '../../middleware/fetchAbsenceReasons'
import AbsencesRouteHandler from './handlers/AbsencesRouteHandler'
import rolloutGuardActivityList from '../../middleware/rolloutGuardActivityList'

export default ({ prisonService }: Services): Router => {
  const router = Router()
  const get = (path: string, handler: RequestHandler) =>
    router.get(path, rolloutGuardActivityList(), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))
  const getActivityList = (path: string, handler: RequestHandler) =>
    router.get(path, rolloutGuardActivityList(), fetchActivityList(prisonService), asyncMiddleware(handler))

  const selectActivityLocationRouteHandler = new SelectActivityLocationRouteHandler(prisonService)
  const activityListRouteHandler = new ActivityListRouteHandler(prisonService)
  const absencesRouteHandler = new AbsencesRouteHandler(prisonService)

  get('/select-activity-location', selectActivityLocationRouteHandler.GET)
  post('/select-activity-location', selectActivityLocationRouteHandler.POST)
  getActivityList('/', activityListRouteHandler.GET)
  post('/', activityListRouteHandler.POST)

  router.get(
    '/absences',
    rolloutGuardActivityList(),
    fetchAbsenceReasons(prisonService),
    fetchActivityList(prisonService),
    asyncMiddleware(absencesRouteHandler.GET),
  )
  router.post(
    '/absences',
    fetchAbsenceReasons(prisonService),
    fetchActivityList(prisonService),
    asyncMiddleware(absencesRouteHandler.POST),
  )
  return router
}
