import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'
import changeLocationRoutes from './change-location'
import createRoutes from './create-an-activity'
import allocateRoutes from './allocate-to-activity'
import attendanceRoutes from './record-attendance'
import unlockListRoutes from './unlock-list'
import spikeRoutes from './spikes'
import activityListRoutes from './spikes/activity-list/activityListRoutes'
import activityListAmRoutes from './spikes/activity-list-am/activityListRoutes'
import errorMessageMiddleware from '../middleware/errorMessageMiddleware'
import timeNowMiddleware from '../middleware/timeNowMiddleware'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(errorMessageMiddleware())
  router.use(timeNowMiddleware())

  router.use('/', homeRoutes())
  router.use('/change-location', changeLocationRoutes(services))
  router.use('/create', createRoutes(services))
  router.use('/allocate', allocateRoutes(services))
  router.use('/attendance', attendanceRoutes(services))
  router.use('/unlock-list', unlockListRoutes(services))
  // Add more beta build routes here

  // Spikes under here spikes
  router.use('/spikes', spikeRoutes(services))
  router.use('/activity-list', activityListRoutes(services))
  router.use('/activity-list-am', activityListAmRoutes(services))
  return router
}
