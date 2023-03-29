import 'reflect-metadata'
import express from 'express'
import createError from 'http-errors'

import flash from 'connect-flash'
import nunjucksSetup from './nunjucks/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import { metricsMiddleware } from './monitoring/metricsApp'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import routes from './routes'
import type { Services } from './services'
import setUpChangeLinks from './middleware/setUpChangeLinks'
import trimRequestBody from './middleware/trimBodyMiddleware'
import setUpValidationExtensions from './middleware/setUpValidationExtensions'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks())
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(nunjucksSetup(app, services))
  app.use(flash())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())
  app.use(setUpChangeLinks())
  app.use(setUpCsrf())
  app.use(setUpCurrentUser(services))
  app.use(trimRequestBody())
  app.use(setUpValidationExtensions())
  app.use(routes(services))
  app.use((req, res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
