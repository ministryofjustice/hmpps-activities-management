import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import validationMiddleware from '../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../middleware/emptyJourneyHandler'
import CategoryRoutes, { Category } from './handlers/category'
import NameRoutes, { Name } from './handlers/name'
import StartJourneyRoutes from './handlers/startJourney'
import { Services } from '../../services'
import RiskLevelRoutes, { RiskLevel } from './handlers/riskLevel'
import MinimumIncentiveRoutes, { MinIncentiveLevel } from './handlers/minimumIncentive'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const categoryHandler = new CategoryRoutes(activitiesService)
  const nameHandler = new NameRoutes()
  const riskLevelHandler = new RiskLevelRoutes()
  const minimumIncentiveHandler = new MinimumIncentiveRoutes(prisonService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes()

  get('/start', startHandler.GET)
  get('/category', categoryHandler.GET, true)
  post('/category', categoryHandler.POST, Category)
  get('/name', nameHandler.GET, true)
  post('/name', nameHandler.POST, Name)
  get('/risk-level', riskLevelHandler.GET, true)
  post('/risk-level', riskLevelHandler.POST, RiskLevel)
  get('/minimum-incentive', minimumIncentiveHandler.GET, true)
  post('/minimum-incentive', minimumIncentiveHandler.POST, MinIncentiveLevel)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation/:id', confirmationHandler.GET, true)

  return router
}
