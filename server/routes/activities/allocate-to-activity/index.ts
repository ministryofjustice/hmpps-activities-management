import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import BeforeYouAllocateRoutes, { ConfirmOptions } from './handlers/beforeYouAllocate'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import CancelRoutes, { ConfirmCancelOptions } from './handlers/cancel'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import RemoveDateOptionRoutes, { RemoveDateOption } from './handlers/removeDateOption'
import AllocateHomeRoutes from './handlers/home'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const allocateHomeHandler = new AllocateHomeRoutes()
  const startJourneyHandler = new StartJourneyRoutes(prisonService, activitiesService)
  const beforeYouAllocateHandler = new BeforeYouAllocateRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const cancelHandler = new CancelRoutes()
  const confirmationHandler = new ConfirmationRoutes()
  const startDateHandler = new StartDateRoutes()
  const endDateOptionHandler = new EndDateOptionRoutes()
  const endDateHandler = new EndDateRoutes()
  const removeDateOptionHandler = new RemoveDateOptionRoutes()

  get('/', allocateHomeHandler.GET)
  get('/prisoner/:prisonerNumber', startJourneyHandler.GET)
  get('/before-you-allocate', beforeYouAllocateHandler.GET, true)
  post('/before-you-allocate', beforeYouAllocateHandler.POST, ConfirmOptions)
  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/end-date-option', endDateOptionHandler.GET, true)
  post('/end-date-option', endDateOptionHandler.POST, EndDateOption)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/cancel', cancelHandler.GET, true)
  post('/cancel', cancelHandler.POST, ConfirmCancelOptions)
  get('/confirmation', confirmationHandler.GET, true)
  get('/remove-date-option', removeDateOptionHandler.GET, true)
  post('/remove-date-option', removeDateOptionHandler.POST, RemoveDateOption)

  return router
}
