import { RequestHandler, Router } from 'express'
import ActivitiesReportingHomeRoutes from './handlers/activitiesHome'
import AppointmentsReportingHomeRoutes from './handlers/appointmentsHome'
import ReportRoutes from './handlers/reportHandler'

export default function Index(): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  const reportingActivitiesHomeHandler = new ActivitiesReportingHomeRoutes()
  const reportingAppointmentsHomeHandler = new AppointmentsReportingHomeRoutes()
  const reportHandler = new ReportRoutes()

  get('/activities-list', reportingActivitiesHomeHandler.GET)
  get('/appointments-list', reportingAppointmentsHomeHandler.GET)

  get('/:reportPath', reportHandler.GET)

  return router
}
