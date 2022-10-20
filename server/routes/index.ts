import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'
import spikeRoutes from './spikes'
import activityListRoutes from './activity-list/activityListRoutes'
import activityListAmRoutes from './activity-list-am/activityListRoutes'
import errorMessageMiddleware from '../middleware/errorMessageMiddleware'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(errorMessageMiddleware())

  router.use(homeRoutes(services))
  router.use(spikeRoutes(services))
  router.use('/activity-list', activityListRoutes(services))
  router.use('/activity-list-am', activityListAmRoutes(services))
  // Add more routes here
  return router
}
