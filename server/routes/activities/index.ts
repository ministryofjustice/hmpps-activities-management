import { Router } from 'express'
import homeRoutes from './home'
import createRoutes from './create-an-activity'
import allocationDashboardRoutes from './allocation-dashboard'
import allocateRoutes from './allocate-to-activity'
import deallocateRoutes from './deallocate-from-activity'
import scheduleRoutes from './manage-schedules'
import attendanceRoutes from './record-attendance'
import attendanceSummaryRoutes from './daily-attendance-summary'
import unlockListRoutes from './unlock-list'
import movementListRoutes from './movement-list'
import changeOfCircumstanceRoutes from './change-of-circumstances'
import waitlistApplicationRoutes from './waitlist-application'
import { Services } from '../../services'
import rolloutMiddleware from '../../middleware/rolloutMiddleware'
import ServiceName from '../../enum/serviceName'
import addServiceReturnLink from '../../middleware/addServiceReturnLink'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  const serviceName = ServiceName.ACTIVITIES

  router.use(rolloutMiddleware(serviceName, services))
  router.use(/\/.+/, addServiceReturnLink('Go to all activities tasks', '/activities'))

  router.use('/', homeRoutes())
  router.use('/create', createRoutes(services))
  router.use('/allocation-dashboard', allocationDashboardRoutes(services))
  router.use('/allocate', allocateRoutes(services))
  router.use('/deallocate', deallocateRoutes(services))
  router.use('/schedule', scheduleRoutes(services))
  router.use('/attendance', attendanceRoutes(services))
  router.use('/attendance-summary', attendanceSummaryRoutes(services))
  router.use('/unlock-list', unlockListRoutes(services))
  router.use('/movement-list', movementListRoutes())
  router.use('/change-of-circumstances', changeOfCircumstanceRoutes(services))
  router.use('/waitlist', waitlistApplicationRoutes(services))

  return router
}
