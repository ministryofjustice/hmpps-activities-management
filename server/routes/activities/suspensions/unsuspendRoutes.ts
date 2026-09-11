import { RequestHandler, Router } from 'express'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import CheckAnswersRoutes from './handlers/checkAnswers'
import { Services } from '../../../services'
import ConfirmationRoutes from './handlers/confirmation'
import SuspendUntilRoutes, { SuspendUntil } from './handlers/suspendUntil'
import setUpJourneyData from '../../../middleware/setUpJourneyData'

export default function Index({ activitiesService, metricsService, tokenStore }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, setUpJourneyData(tokenStore), emptyJourneyHandler('suspendJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, setUpJourneyData(tokenStore), validationMiddleware(type), handler)

  const suspendUntilHandler = new SuspendUntilRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes(metricsService)

  get('/suspend-until', suspendUntilHandler.GET, true)
  post('/suspend-until', suspendUntilHandler.POST, SuspendUntil)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation', confirmationHandler.GET)

  return router
}
