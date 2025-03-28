import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  /** Add a static asset route */
  function staticRoute(assetUrl: string, assetPath: string): void {
    router.use(
      assetUrl,
      express.static(path.join(process.cwd(), assetPath), {
        maxAge: config.staticResourceCacheDuration,
        redirect: false,
      }),
    )
  }

  // TODO: JQuery is a peer dependency of moj-frontend, consider helping to remove this from there and therefore as a dependency of this project
  Array.of(
    '/dist/assets',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend',
    '/node_modules/jquery/dist',
  ).forEach(dir => staticRoute('/assets', dir))

  // set favicon redirect
  staticRoute('/favicon.ico', '/node_modules/govuk-frontend/dist/govuk/assets/favicon.ico')

  // DPR
  staticRoute('/assets/dpr', '/node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/assets')

  // // Third-party plugins that DPR does not automatically bundle - day.js and chart.js
  staticRoute('/assets/ext/chart.js', '/node_modules/chart.js/dist/chart.umd.js')
  staticRoute('/assets/ext/chart.umd.js.map', '/node_modules/chart.js/dist/chart.umd.js.map')
  staticRoute(
    '/assets/ext/chartjs-datalabels.js',
    '/node_modules/chartjs-plugin-datalabels/dist/chartjs-plugin-datalabels.min.js',
  )
  staticRoute('/assets/ext/day.js', '/node_modules/dayjs/dayjs.min.js')
  staticRoute('/assets/ext/dayjs/plugin/customParseFormat.js', '/node_modules/dayjs/plugin/customParseFormat.js')

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
