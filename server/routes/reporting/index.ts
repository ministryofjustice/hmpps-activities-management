import { RequestHandler, Router } from 'express'
import ReportListUtils from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/report-list/utils'
import config from '../../config'
import asyncMiddleware from '../../middleware/asyncMiddleware'

export default function Index(): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  get(
    '/waitlist-agg',
    ReportListUtils.createReportListRequestHandler({
      title: 'Waitlist Aggregate Report',
      definitionName: 'waitlist-list-001',
      variantName: 'waitlist-aggregate-001',
      apiUrl: config.apis.reporting.url,
      apiTimeout: config.apis.reporting.timeout,
      layoutTemplate: 'layout.njk',
      tokenProvider: (req, res, next) => res.locals.user.token,
      definitionsPath: 'definitions/prisons/dps/activities',
    }),
  )

  return router
}
