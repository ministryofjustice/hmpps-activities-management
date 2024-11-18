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

  router.use('/assets', express.static(path.join(process.cwd(), '/assets'), cacheControl))

  // TODO: Peer dependency of moj-frontend, consider helping to remove this from there and therefore as a dependency of this project
  router.use('/assets', express.static(path.join(process.cwd(), '/node_modules/jquery/dist'), cacheControl))

  router.use(
    '/assets/dpr',
    express.static(
      path.join(process.cwd(), '/node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/assets'),
    ),
  )

  router.use(
    '/assets/ext/chart.js',
    express.static(path.join(process.cwd(), '/node_modules/chart.js/dist/chart.umd.js')),
  )

  router.use(
    '/assets/ext/chartjs-datalabels.js',
    express.static(
      path.join(process.cwd(), '/node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js'),
    ),
  )

  router.use('/assets/ext/day.js', express.static(path.join(process.cwd(), '/node_modules/dayjs/dayjs.min.js')))

  router.use(
    '/assets/ext/dayjs/plugin/customParseFormat.js',
    express.static(path.join(process.cwd(), '/node_modules/dayjs/plugin/customParseFormat.js')),
  )

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
