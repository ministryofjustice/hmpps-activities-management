import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import { Services } from '../../../../services'
import ScheduleRouteHandler from './handlers/ScheduleRouteHandler'

export default ({ capacitiesService, activitiesService }: Services): Router => {
  const router = Router({ mergeParams: true })
  const scheduleRouteHandler = new ScheduleRouteHandler(capacitiesService, activitiesService)
  router.get('/', asyncMiddleware(scheduleRouteHandler.GET))
  return router
}
