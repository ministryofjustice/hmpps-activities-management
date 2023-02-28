import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import NameRoutes, { Name } from './handlers/name'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import DaysAndTimesRoutes, { DaysAndTimes } from './handlers/daysAndTimes'
import LocationRoutes, { Location } from './handlers/location'
import CapacityRoutes, { Capacity } from './handlers/capacity'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import BankHolidayOptionRoutes, { BankHolidayOption } from './handlers/bankHoliday'

export default function Index({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createScheduleJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const nameHandler = new NameRoutes()
  const startDateHandler = new StartDateRoutes()
  const endDateOptionHandler = new EndDateOptionRoutes()
  const endDateHandler = new EndDateRoutes()
  const daysAndTimesHandler = new DaysAndTimesRoutes()
  const bankHolidayHandler = new BankHolidayOptionRoutes()
  const locationHandler = new LocationRoutes(prisonService)
  const capacityHandler = new CapacityRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes(activitiesService)

  get('/start', startHandler.GET)
  get('/name', nameHandler.GET, true)
  post('/name', nameHandler.POST, Name)
  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/end-date-option', endDateOptionHandler.GET, true)
  post('/end-date-option', endDateOptionHandler.POST, EndDateOption)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/days-and-times', daysAndTimesHandler.GET, true)
  post('/days-and-times', daysAndTimesHandler.POST, DaysAndTimes)
  get('/bank-holiday-option', bankHolidayHandler.GET, true)
  post('/bank-holiday-option', bankHolidayHandler.POST, BankHolidayOption)
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.POST, Location)
  get('/capacity', capacityHandler.GET, true)
  post('/capacity', capacityHandler.POST, Capacity)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation/:scheduleId', confirmationHandler.GET, true)
  return router
}
