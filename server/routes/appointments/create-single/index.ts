import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import SelectPrisonerRoutes, { PrisonerSearch } from './handlers/selectPrisoner'
import CategoryRoutes, { Category } from './handlers/category'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import CheckAnswersRoutes from './handlers/checkAnswers'
import { Services } from '../../../services'

export default function Index({ prisonService, activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      emptyJourneyHandler('createSingleAppointmentJourney', stepRequiresSession),
      asyncMiddleware(handler),
    )
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService)
  const categoryHandler = new CategoryRoutes(activitiesService)
  const locationHandler = new LocationRoutes(prisonService)
  const dateAndTimeRoutesHandler = new DateAndTimeRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)

  get('/start', startHandler.GET)
  get('/select-prisoner', selectPrisonerHandler.GET, true)
  post('/select-prisoner', selectPrisonerHandler.POST, PrisonerSearch)
  get('/category', categoryHandler.GET, true)
  post('/category', categoryHandler.POST, Category)
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.POST, Location)
  get('/date-and-time', dateAndTimeRoutesHandler.GET, true)
  post('/date-and-time', dateAndTimeRoutesHandler.POST, DateAndTime)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)

  return router
}
