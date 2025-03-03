import { Request, Response } from 'express'
import ReportListUtils from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/report-list/utils'
import config from '../../../config'
import reports from '../reportLists/reports'

export default class ReportRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { reportPath } = req.params
    const allReports = [...reports.activities, ...reports.appointments]

    const [matchingReport] = allReports.filter(report => report.path === reportPath)

    ReportListUtils.createReportListRequestHandler({
      title: matchingReport.title,
      definitionName: matchingReport.definitionName,
      variantName: matchingReport.variantName,
      apiUrl: config.apis.reporting.url,
      apiTimeout: config.apis.reporting.timeout,
      layoutTemplate: 'layout.njk',
      tokenProvider: (request, response, next) => response.locals.user.token,
      definitionsPath: 'definitions/prisons/dps/activities',
    })
  }
}
