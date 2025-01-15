import { Router } from 'express'
import homeRoutes from './home/handlers'
import manageActivitiesRoutes from './manage-activities'
import createAndEditActivitiesRoutes from './create-an-activity'
import allocationDashboardRoutes from './allocation-dashboard'
import allocationRoutes from './manage-allocations'
import attendanceRoutes from './record-attendance'
import attendanceSummaryRoutes from './daily-attendance-summary'
import unlockListRoutes from './unlock-list'
import movementListRoutes from './movement-list'
import changeOfCircumstanceRoutes from './change-of-circumstances'
import waitlistApplicationRoutes from './waitlist-application'
import waitlistDashboardRoutes from './waitlist-dashboard'
import exclusionsRoutes from './exclusions'
import suspensionsRoutes from './suspensions'
import nonAssociationsRoutes from './non-associations'
import { Services } from '../../services'
import rolloutMiddleware from '../../middleware/rolloutMiddleware'
import ServiceName from '../../enum/serviceName'
import addServiceReturnLink from '../../middleware/addServiceReturnLink'
import adminRoutes from './administration'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  const serviceName = ServiceName.ACTIVITIES

  router.use(rolloutMiddleware(serviceName))
  router.use(/\/.+/, addServiceReturnLink('Go to all activities tasks', '/activities'))

  router.use(homeRoutes())
  router.use(manageActivitiesRoutes(services))
  router.use(adminRoutes(services))
  router.use(createAndEditActivitiesRoutes(services))
  router.use('/allocation-dashboard', allocationDashboardRoutes(services))
  router.use('/allocations', allocationRoutes(services))
  router.use('/attendance', attendanceRoutes(services))
  router.use('/attendance-summary', attendanceSummaryRoutes(services))
  router.use('/unlock-list', unlockListRoutes(services))
  router.use('/movement-list', movementListRoutes(services))
  router.use('/change-of-circumstances', changeOfCircumstanceRoutes(services))
  router.use('/waitlist', waitlistApplicationRoutes(services))
  router.use('/waitlist-dashboard', waitlistDashboardRoutes(services))
  router.use('/exclusions', exclusionsRoutes(services))
  router.use('/suspensions', suspensionsRoutes(services))
  router.use('/non-associations', nonAssociationsRoutes(services))

  return router
}
