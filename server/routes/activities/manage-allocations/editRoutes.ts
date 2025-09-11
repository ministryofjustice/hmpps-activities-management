import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import RemoveDateOptionRoutes, { RemoveDateOption } from './handlers/removeDateOption'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import ConfirmExclusionsRoutes from './handlers/confirmExclusions'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const startDateHandler = new StartDateRoutes(activitiesService)
  const removeDateOptionHandler = new RemoveDateOptionRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const confirmExclusionsHandler = new ConfirmExclusionsRoutes(activitiesService)

  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/remove-end-date-option', removeDateOptionHandler.GET, true)
  post('/remove-end-date-option', removeDateOptionHandler.POST, RemoveDateOption)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)
  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/confirm-exclusions', confirmExclusionsHandler.GET, true)
  post('/confirm-exclusions', confirmExclusionsHandler.POST)

  return router
}
