import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import SelectActivityLocationRouteHandler from './handlers/SelectActivityLocationRouteHandler'
import ActivityListRouteHandler from './handlers/ActivityListRouteHandler'
import fetchActivityListAm from '../../../middleware/fetchActivityListAm'
import rolloutGuardActivityList from '../../../middleware/rolloutGuardActivityList'
import AbsencesRouteHandler from './handlers/AbsencesRouteHandler'

export default ({ activitiesService }: Services): Router => {
  const router = Router()
  const get = (path: string, handler: RequestHandler) =>
    router.get(path, rolloutGuardActivityList(), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const selectActivityLocationRouteHandler = new SelectActivityLocationRouteHandler(activitiesService)
  const activityListRouteHandler = new ActivityListRouteHandler(activitiesService)
  const absencesRouteHandler = new AbsencesRouteHandler(activitiesService)

  get('/select-activity-location', selectActivityLocationRouteHandler.GET)
  post('/select-activity-location', selectActivityLocationRouteHandler.POST)

  router.get(
    '/',
    rolloutGuardActivityList(),
    fetchActivityListAm(activitiesService),
    asyncMiddleware(activityListRouteHandler.GET),
  )
  post('/', activityListRouteHandler.POST)

  router.get(
    '/absences',
    rolloutGuardActivityList(),
    fetchActivityListAm(activitiesService),
    asyncMiddleware(absencesRouteHandler.GET),
  )
  router.post('/absences', fetchActivityListAm(activitiesService), asyncMiddleware(absencesRouteHandler.POST))
  return router
}
