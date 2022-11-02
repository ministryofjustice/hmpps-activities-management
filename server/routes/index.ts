import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'
import changeLocationRoutes from './change-location'
import activitiesRoutes from './activities'
import spikeRoutes from './spikes'
import activityListRoutes from './spikes/activity-list/activityListRoutes'
import activityListAmRoutes from './spikes/activity-list-am/activityListRoutes'
import errorMessageMiddleware from '../middleware/errorMessageMiddleware'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(errorMessageMiddleware())

  router.use(homeRoutes())
  router.use(changeLocationRoutes(services))
  router.use(activitiesRoutes())
  router.use(spikeRoutes(services))
  router.use('/activity-list', activityListRoutes(services))
  router.use('/activity-list-am', activityListAmRoutes(services))
  // Add more routes here
  return router
}
