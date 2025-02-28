import { RequestHandler, Router } from 'express'
import ReportListUtils from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/report-list/utils'
import config from '../../config'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivitiesReportingHomeRoutes from './handlers/activitiesHome'
import AppointmentsReportingHomeRoutes from './handlers/appointmentsHome'
import reports from './reportLists/reports'

export default function Index(): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const reportingActivitiesHomeHandler = new ActivitiesReportingHomeRoutes()
  const reportingAppointmentsHomeRoutes = new AppointmentsReportingHomeRoutes()

  get('/activities-list', reportingActivitiesHomeHandler.GET)
  get('/appointments-list', reportingAppointmentsHomeRoutes.GET)

  const allReports = [...reports.activities, ...reports.appointments]
  allReports.forEach(report =>
    get(
      report.path,
      ReportListUtils.createReportListRequestHandler({
        title: report.title,
        definitionName: report.definitionName,
        variantName: report.variantName,
        apiUrl: config.apis.reporting.url,
        apiTimeout: config.apis.reporting.timeout,
        layoutTemplate: 'layout.njk',
        tokenProvider: (req, res, next) => res.locals.user.token,
        definitionsPath: 'definitions/prisons/dps/activities',
      }),
    ),
  )

  return router
}
