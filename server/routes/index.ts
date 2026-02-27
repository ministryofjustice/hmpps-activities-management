import { Router } from 'express'
import { routes as dprRoutes } from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/routes'
import type { Services } from '../services'
import homeRoutes from './home'
import activityRoutes from './activities'
import errorMessageMiddleware from '../middleware/errorMessageMiddleware'
import successMessageMiddleware from '../middleware/successMessageMiddleware'
import timeNowMiddleware from '../middleware/timeNowMiddleware'
import routeAuthMiddleware from '../middleware/routeAuthMiddleware'
import appointmentRoutes from './appointments'
import reportingRoutes from './reporting'
import profileImage from './profileImage'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(routeAuthMiddleware())

  router.use(errorMessageMiddleware())
  router.use(successMessageMiddleware())
  router.use(timeNowMiddleware())
  router.use('/', homeRoutes())
  router.use('/', dprRoutes({ services, layoutPath: 'server/views/layout.njk' }))
  router.use('/profileImage', profileImage(services))
  router.use('/activities', activityRoutes(services))
  router.use('/appointments', appointmentRoutes(services))
  router.use('/dpr-reporting', reportingRoutes())

  router.use('/page/:page', (req, res) => {
    const referrer = new URL(req.get('Referrer'))
    const targetId = req.query.id
    referrer.searchParams.set('page', req.params.page)
    res.redirect(referrer.toString() + (targetId ? `#${targetId}` : ''))
  })

  return router
}
