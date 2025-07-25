import { RequestHandler, Router } from 'express'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'
import DashboardRoutes from './handlers/dashboard'
import AttendanceDataRoutes from './handlers/attendanceData'
import { Services } from '../../../services'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const selectDateRoutes = new SelectDateRoutes()
  const dashboardRoutes = new DashboardRoutes(activitiesService)
  const attendanceDataRoutes = new AttendanceDataRoutes(activitiesService, prisonService)

  get('/select-date', selectDateRoutes.GET)
  post('/select-date', selectDateRoutes.POST, SelectDate)
  get('/dashboard', dashboardRoutes.GET)
  post('/dashboard', dashboardRoutes.POST)
  get('/attendance-data', attendanceDataRoutes.GET)
  post('/attendance-data', attendanceDataRoutes.POST)

  return router
}
