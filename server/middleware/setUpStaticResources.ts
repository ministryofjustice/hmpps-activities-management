import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration }

  // TODO: JQuery is a peer dependency of moj-frontend, consider helping to remove this from there and therefore as a dependency of this project
  Array.of(
    '/dist/assets',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/jquery/dist',
  ).forEach(dir => {
    router.use('/assets', express.static(path.join(process.cwd(), dir), cacheControl))
  })

  // DPR assets
  router.use(
    '/assets/dpr',
    express.static(
      path.join(process.cwd(), '/node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/assets'),
      cacheControl,
    ),
  )

  // moj assets for DPR
  router.use(
    '/moj/assets',
    express.static(path.join(process.cwd(), '/node_modules/@ministryofjustice/frontend/moj/assets'), cacheControl),
  )

  // Chart js
  router.use(
    '/assets/ext/chart.js',
    express.static(path.join(process.cwd(), '/node_modules/chart.js/dist/chart.umd.js')),
  )

  router.use(
    '/assets/ext/chart.umd.js.map',
    express.static(path.join(process.cwd(), '/node_modules/chart.js/dist/chart.umd.js.map')),
  )

  router.use(
    '/assets/ext/chartjs-datalabels.js',
    express.static(
      path.join(process.cwd(), '/node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js'),
    ),
  )

  // Dayjs
  router.use('/assets/ext/day.js', express.static(path.join(process.cwd(), '/node_modules/dayjs/dayjs.min.js')))

  router.use(
    '/assets/ext/dayjs/plugin/customParseFormat.js',
    express.static(path.join(process.cwd(), '/node_modules/dayjs/plugin/customParseFormat.js')),
  )

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
