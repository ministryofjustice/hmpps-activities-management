import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import config from '../config'

export default function setUpStaticResources(): Router {
  const router = express.Router()

  router.use(compression())

  //  Static Resources Configuration
  const cacheControl = { maxAge: config.staticResourceCacheDuration * 1000 }

  router.use('/assets', express.static(path.join(process.cwd(), '/assets'), cacheControl))

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
