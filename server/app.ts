import 'reflect-metadata'
import express from 'express'

import flash from 'connect-flash'
import createHttpError from 'http-errors'
import { getFrontendComponents, retrieveCaseLoadData } from '@ministryofjustice/hmpps-connect-dps-components'
import { setupResources } from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/setUpDprResources'
import nunjucksSetup from './nunjucks/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'

import config from './config'
import routes from './routes'
import type { Services } from './services'
import setUpSuccessMessages from './middleware/setUpSuccessMessages'
import setUpChangeLinks from './middleware/setUpChangeLinks'
import trimRequestBody from './middleware/trimBodyMiddleware'
import setUpValidationExtensions from './middleware/setUpValidationExtensions'
import formValidationErrorHandler from './middleware/formValidationErrorHandler'
import populateJourney from './middleware/populateJourney'
import logger from '../logger'
import redirectInterceptor from './middleware/redirectInterceptor'
import renderInterceptor from './middleware/renderInterceptor'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)
  app.use(setUpHealthChecks(services))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(flash())
  const env = nunjucksSetup(app, services)
  app.use(setupResources(services, 'server/views/layout.njk', env, config.dpr))
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware())
  app.use(setUpSuccessMessages())
  app.use(setUpChangeLinks())
  app.use(setUpCsrf())
  app.get(
    '*any',
    getFrontendComponents({
      componentApiConfig: config.apis.componentApi,
      requestOptions: { includeSharedData: true },
      dpsUrl: config.dpsUrl,
      logger,
    }),
  )
  app.use(
    retrieveCaseLoadData({
      logger,
      prisonApiConfig: config.apis.prisonApi,
    }),
  )
  app.use(setUpCurrentUser(services.activitiesService))
  app.use(trimRequestBody())
  app.use(setUpValidationExtensions())
  app.use(populateJourney())
  app.use(renderInterceptor(services.tokenStore))
  app.use(redirectInterceptor(services.tokenStore))
  app.use(routes(services))
  app.use(formValidationErrorHandler)
  app.use((req, res, next) => next(createHttpError.NotFound()))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
