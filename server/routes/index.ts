import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'
import changeLocationRoutes from './change-location'
import createRoutes from './create-an-activity'
import scheduleRoutes from './manage-schedules'
import allocateRoutes from './allocate-to-activity'
import attendanceRoutes from './record-attendance'
import unlockListRoutes from './unlock-list'
import spikeRoutes from './spikes'
import errorMessageMiddleware from '../middleware/errorMessageMiddleware'
import successMessageMiddleware from '../middleware/successMessageMiddleware'
import timeNowMiddleware from '../middleware/timeNowMiddleware'
import routeAuthMiddleware from '../middleware/routeAuthMiddleware'
import appointmentRoutes from './appointments'
import rolloutMiddleware from '../middleware/rolloutMiddleware'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })

  router.use(routeAuthMiddleware())

  router.use(errorMessageMiddleware())
  router.use(successMessageMiddleware())
  router.use(timeNowMiddleware())

  router.use('/change-location', changeLocationRoutes(services))

  router.use(rolloutMiddleware(services))

  router.use('/', homeRoutes())
  router.use('/create', createRoutes(services))
  router.use('/allocate', allocateRoutes(services))
  router.use('/schedule', scheduleRoutes(services))
  router.use('/attendance', attendanceRoutes(services))
  router.use('/unlock-list', unlockListRoutes(services))
  router.use('/appointments', appointmentRoutes(services))
  // Add more beta build routes here

  // Spikes under here spikes
  router.use('/spikes', spikeRoutes(services))

  router.use('/page/:page', (req, res) => {
    const referrer = new URL(req.get('Referrer'))
    const targetId = req.query.id
    referrer.searchParams.set('page', req.params.page)
    res.redirect(referrer.toString() + (targetId ? `#${targetId}` : ''))
  })

  return router
}
