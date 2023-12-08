import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import ConfirmExclusionsRoutes from './handlers/confirmExclusions'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const confirmExclusionsHandler = new ConfirmExclusionsRoutes(activitiesService)

  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/confirm-exclusions', confirmExclusionsHandler.GET, true)
  post('/confirm-exclusions', confirmExclusionsHandler.POST)

  return router
}
