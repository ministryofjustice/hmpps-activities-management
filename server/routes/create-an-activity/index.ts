import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import validationMiddleware from '../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../middleware/emptyJourneyHandler'
import CategoryRoutes, { Category } from './handlers/category'
import NameRoutes, { Name } from './handlers/name'
import StartJourneyRoutes from './handlers/startJourney'
import { Services } from '../../services'
import RiskLevelRoutes, { RiskLevel } from './handlers/riskLevel'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import PayRoutes, { Pay } from './handlers/pay'
import CheckPayRoutes from './handlers/checkPay'
import RemovePayRoutes from './handlers/removePay'

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
  const payHandler = new PayRoutes(prisonService, activitiesService)
  const removePayHandler = new RemovePayRoutes()
  const checkPayHandler = new CheckPayRoutes(prisonService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService, prisonService)
  const confirmationHandler = new ConfirmationRoutes()

  get('/start', startHandler.GET)
  get('/category', categoryHandler.GET, true)
  post('/category', categoryHandler.POST, Category)
  get('/name', nameHandler.GET, true)
  post('/name', nameHandler.POST, Name)
  get('/risk-level', riskLevelHandler.GET, true)
  post('/risk-level', riskLevelHandler.POST, RiskLevel)
  get('/pay', payHandler.GET, true)
  post('/pay', payHandler.POST, Pay)
  get('/remove-pay', removePayHandler.GET, true)
  get('/check-pay', checkPayHandler.GET, true)
  post('/check-pay', checkPayHandler.POST)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation/:id', confirmationHandler.GET, true)

  return router
}
