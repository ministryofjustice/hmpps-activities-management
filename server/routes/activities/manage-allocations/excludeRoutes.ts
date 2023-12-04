import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import config from '../../../config'
import ConfirmExclusionsRoutes from './handlers/confirmExclusions'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const confirmExclusionsHandler = new ConfirmExclusionsRoutes(activitiesService)

  // Exclusion routes are only accessible when running locally or when feature toggle is provided
  router.use((req, res, next) => (!config.exclusionsFeatureToggleEnabled ? next(createHttpError.NotFound()) : next()))

  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/confirm-exclusions', confirmExclusionsHandler.GET, true)
  post('/confirm-exclusions', confirmExclusionsHandler.POST)

  return router
}
