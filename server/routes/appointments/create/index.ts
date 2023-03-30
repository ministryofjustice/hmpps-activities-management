import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import SelectPrisonerRoutes, { PrisonerSearch } from './handlers/selectPrisoner'
import UploadPrisonerListRoutes, { PrisonerList } from './handlers/uploadPrisonerList'
import CategoryRoutes, { Category } from './handlers/category'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import RepeatRoutes, { Repeat } from './handlers/repeat'
import RepeatPeriodAndCountRoutes, { RepeatPeriodAndCount } from './handlers/repeatPeriodAndCount'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import HowToAddPrisoners, { HowToAddPrisonersForm } from './handlers/howToAddPrisoners'
import ReviewPrisoners, { AddAnotherForm } from './handlers/reviewPrisoners'
import { Services } from '../../../services'
import PrisonerListCsvParser from '../../../utils/PrisonerListCsvParser'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'

export default function Index({ prisonService, activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createAppointmentJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService)
  const uploadPrisonerListRoutes = new UploadPrisonerListRoutes(new PrisonerListCsvParser(), prisonService)
  const categoryHandler = new CategoryRoutes(activitiesService)
  const locationHandler = new LocationRoutes(prisonService)
  const dateAndTimeHandler = new DateAndTimeRoutes()
  const repeatHandler = new RepeatRoutes()
  const repeatPeriodAndCountHandler = new RepeatPeriodAndCountRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes()
  const howToAddPrisoners = new HowToAddPrisoners()
  const reviewPrisoners = new ReviewPrisoners()

  get('/start-individual', startHandler.INDIVIDUAL)
  get('/start-group', startHandler.GROUP)
  get('/select-prisoner', selectPrisonerHandler.GET, true)
  post('/select-prisoner', selectPrisonerHandler.POST, PrisonerSearch)
  get('/upload-prisoner-list', uploadPrisonerListRoutes.GET, true)
  router.post(
    '/upload-prisoner-list',
    setUpMultipartFormDataParsing(),
    validationMiddleware(PrisonerList),
    asyncMiddleware(uploadPrisonerListRoutes.POST),
  )
  get('/category', categoryHandler.GET, true)
  post('/category', categoryHandler.POST, Category)
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.POST, Location)
  get('/date-and-time', dateAndTimeHandler.GET, true)
  post('/date-and-time', dateAndTimeHandler.POST, DateAndTime)
  get('/repeat', repeatHandler.GET, true)
  post('/repeat', repeatHandler.POST, Repeat)
  get('/repeat-period-and-count', repeatPeriodAndCountHandler.GET, true)
  post('/repeat-period-and-count', repeatPeriodAndCountHandler.POST, RepeatPeriodAndCount)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation/:id', confirmationHandler.GET, true)
  get('/how-to-add-prisoners', howToAddPrisoners.GET, true)
  post('/how-to-add-prisoners', howToAddPrisoners.POST, HowToAddPrisonersForm)
  get('/review-prisoners', reviewPrisoners.GET, true)
  post('/review-prisoners', reviewPrisoners.POST, AddAnotherForm)

  return router
}
