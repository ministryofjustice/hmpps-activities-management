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

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
