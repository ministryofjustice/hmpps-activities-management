import { Router } from 'express'
import activityListRoutes from './activity-list/activityListRoutes'
import { Services } from '../../services'

export default function alphaRouter(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use('/activity-list', activityListRoutes(services))
  // Add more routes here
  return router
}
