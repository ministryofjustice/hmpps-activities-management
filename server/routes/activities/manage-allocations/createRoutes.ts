import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import BeforeYouAllocateRoutes, { ConfirmOptions } from './handlers/beforeYouAllocate'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import CancelRoutes, { ConfirmCancelOptions } from './handlers/cancel'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import RemoveDateOptionRoutes, { RemoveDateOption } from './handlers/removeDateOption'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import AllocationErrorRoutes from './handlers/allocationError'

export default function Index({ activitiesService, prisonService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startJourneyHandler = new StartJourneyRoutes(prisonService, activitiesService, metricsService)
  const beforeYouAllocateHandler = new BeforeYouAllocateRoutes(activitiesService)
  const startDateHandler = new StartDateRoutes(activitiesService)
  const endDateHandler = new EndDateRoutes()
  const removeDateOptionHandler = new RemoveDateOptionRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const endDateOptionHandler = new EndDateOptionRoutes()
  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const cancelHandler = new CancelRoutes()
  const confirmationHandler = new ConfirmationRoutes(metricsService)
  const errorHandler = new AllocationErrorRoutes()

  get('/prisoner/:prisonerNumber', startJourneyHandler.GET)
  get('/before-you-allocate', beforeYouAllocateHandler.GET, true)
  post('/before-you-allocate', beforeYouAllocateHandler.POST, ConfirmOptions)
  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/remove-end-date-option', removeDateOptionHandler.GET, true)
  post('/remove-end-date-option', removeDateOptionHandler.POST, RemoveDateOption)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)
  get('/end-date-option', endDateOptionHandler.GET, true)
  post('/end-date-option', endDateOptionHandler.POST, EndDateOption)
  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/cancel', cancelHandler.GET, true)
  post('/cancel', cancelHandler.POST, ConfirmCancelOptions)
  get('/confirmation', confirmationHandler.GET, true)

  get('/error/:errorType(transferred)', errorHandler.GET, true)

  return router
}
