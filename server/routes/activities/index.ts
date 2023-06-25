import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import HomeRoutes from './handlers/home'
import createRoutes from '../create-an-activity'
import allocationDashboardRoutes from '../allocation-dashboard'
import allocateRoutes from '../allocate-to-activity'
import deallocateRoutes from '../deallocate-from-activity'
import scheduleRoutes from '../manage-schedules'
import attendanceRoutes from '../record-attendance'
import attendanceSummaryRoutes from '../daily-attendance-summary'
import unlockListRoutes from '../unlock-list'
import changeOfCircumstanceRoutes from '../change-of-circumstances'
import { Services } from '../../services'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const activitiesDashboardHandler = new HomeRoutes()

  get('/', activitiesDashboardHandler.GET)
  router.use('/create', createRoutes(services))
  router.use('/allocation-dashboard', allocationDashboardRoutes(services))
  router.use('/allocate', allocateRoutes(services))
  router.use('/deallocate', deallocateRoutes(services))
  router.use('/schedule', scheduleRoutes(services))
  router.use('/attendance', attendanceRoutes(services))
  router.use('/attendance-summary', attendanceSummaryRoutes(services))
  router.use('/unlock-list', unlockListRoutes(services))
  router.use('/change-of-circumstances', changeOfCircumstanceRoutes(services))

  return router
}
