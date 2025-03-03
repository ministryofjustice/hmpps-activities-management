import { RequestHandler, Router } from 'express'
// import ReportListUtils from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/report-list/utils'
// import config from '../../config'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivitiesReportingHomeRoutes from './handlers/activitiesHome'
import AppointmentsReportingHomeRoutes from './handlers/appointmentsHome'
import ReportRoutes from './handlers/reportHandler'

export default function Index(): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const reportingActivitiesHomeHandler = new ActivitiesReportingHomeRoutes()
  const reportingAppointmentsHomeHandler = new AppointmentsReportingHomeRoutes()
  const reportHandler = new ReportRoutes()

  get('/activities-list', reportingActivitiesHomeHandler.GET)
  get('/appointments-list', reportingAppointmentsHomeHandler.GET)

  get('/:reportPath', reportHandler.GET)

  return router
}
