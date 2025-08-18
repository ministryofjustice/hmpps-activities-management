import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import ConfirmExclusionsRoutes from './handlers/confirmExclusions'
import setUpJourneyData from '../../../middleware/setUpJourneyData'

export default function Index({ activitiesService, tokenStore }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, setUpJourneyData(tokenStore), emptyJourneyHandler('allocateJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, setUpJourneyData(tokenStore), validationMiddleware(type), handler)

  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const confirmExclusionsHandler = new ConfirmExclusionsRoutes(activitiesService)

  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/confirm-exclusions', confirmExclusionsHandler.GET, true)
  post('/confirm-exclusions', confirmExclusionsHandler.POST)

  return router
}
