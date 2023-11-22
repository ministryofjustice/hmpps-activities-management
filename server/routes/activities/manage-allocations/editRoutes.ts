import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import RemoveDateOptionRoutes, { RemoveDateOption } from './handlers/removeDateOption'
import DeallocationReasonRoutes, { DeallocationReason } from './handlers/deallocationReason'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import config from '../../../config'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startDateHandler = new StartDateRoutes(activitiesService)
  const endDateHandler = new EndDateRoutes()
  const deallocationReasonHandler = new DeallocationReasonRoutes(activitiesService)
  const removeDateOptionHandler = new RemoveDateOptionRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const exclusionsHandler = new ExclusionRoutes(activitiesService)

  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/reason', deallocationReasonHandler.GET, true)
  post('/reason', deallocationReasonHandler.POST, DeallocationReason)
  get('/remove-end-date-option', removeDateOptionHandler.GET, true)
  post('/remove-end-date-option', removeDateOptionHandler.POST, RemoveDateOption)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)

  // Exclusion routes are only accessible when running locally or when feature toggle is provided
  router.use((req, res, next) => (!config.exclusionsFeatureToggleEnabled ? next(createHttpError.NotFound()) : next()))

  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)

  return router
}
