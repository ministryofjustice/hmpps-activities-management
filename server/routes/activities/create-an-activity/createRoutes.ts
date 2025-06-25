import { RequestHandler, Router } from 'express'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import { Services } from '../../../services'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'

export default function Index({ activitiesService, prisonService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const startHandler = new StartJourneyRoutes(metricsService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService, prisonService, metricsService)
  const confirmationHandler = new ConfirmationRoutes()

  get('/start', startHandler.GET)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation/:id', confirmationHandler.GET, true)

  return router
}
