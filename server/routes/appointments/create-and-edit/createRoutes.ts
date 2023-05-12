import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import emptyAppointmentJourneyHandler from '../../../middleware/emptyAppointmentJourneyHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import SelectPrisonerRoutes, { PrisonerSearch } from './handlers/selectPrisoner'
import UploadPrisonerListRoutes, { PrisonerList } from './handlers/uploadPrisonerList'
import CategoryRoutes, { Category } from './handlers/category'
import DescriptionRoutes, { Description } from './handlers/description'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import RepeatRoutes, { Repeat } from './handlers/repeat'
import RepeatPeriodAndCountRoutes, { RepeatPeriodAndCount } from './handlers/repeatPeriodAndCount'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import HowToAddPrisoners, { HowToAddPrisonersForm } from './handlers/howToAddPrisoners'
import UploadByCSV from './handlers/uploadByCsv'
import ReviewPrisoners from './handlers/reviewPrisoners'
import { Services } from '../../../services'
import PrisonerListCsvParser from '../../../utils/prisonerListCsvParser'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import setAppointmentJourneyMode from '../../../middleware/appointments/setAppointmentJourneyMode'
import { AppointmentJourneyMode } from './appointmentJourney'
import EditAppointmentService from '../../../services/editAppointmentService'

export default function Create({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      emptyAppointmentJourneyHandler(stepRequiresSession),
      setAppointmentJourneyMode(AppointmentJourneyMode.CREATE),
      asyncMiddleware(handler),
    )
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(
      path,
      validationMiddleware(type),
      setAppointmentJourneyMode(AppointmentJourneyMode.CREATE),
      asyncMiddleware(handler),
    )

  const editAppointmentService = new EditAppointmentService(activitiesService)
  const startHandler = new StartJourneyRoutes(editAppointmentService)
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService)
  const uploadPrisonerListRoutes = new UploadPrisonerListRoutes(new PrisonerListCsvParser(), prisonService)
  const categoryHandler = new CategoryRoutes(activitiesService)
  const descriptionHandler = new DescriptionRoutes()
  const locationHandler = new LocationRoutes(activitiesService)
  const dateAndTimeHandler = new DateAndTimeRoutes(activitiesService)
  const repeatHandler = new RepeatRoutes()
  const repeatPeriodAndCountHandler = new RepeatPeriodAndCountRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes()
  const howToAddPrisoners = new HowToAddPrisoners(editAppointmentService)
  const uploadByCsv = new UploadByCSV()
  const reviewPrisoners = new ReviewPrisoners(editAppointmentService)

  get('/start-individual', startHandler.INDIVIDUAL)
  get('/start-group', startHandler.GROUP)
  get('/select-prisoner', selectPrisonerHandler.GET, true)
  post('/select-prisoner', selectPrisonerHandler.POST, PrisonerSearch)
  get('/upload-prisoner-list', uploadPrisonerListRoutes.GET, true)
  router.post(
    '/upload-prisoner-list',
    setUpMultipartFormDataParsing(),
    validationMiddleware(PrisonerList),
    setAppointmentJourneyMode(AppointmentJourneyMode.CREATE),
    asyncMiddleware(uploadPrisonerListRoutes.POST),
  )
  get('/category', categoryHandler.GET, true)
  post('/category', categoryHandler.POST, Category)
  get('/description', descriptionHandler.GET, true)
  post('/description', descriptionHandler.POST, Description)
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.CREATE, Location)
  get('/date-and-time', dateAndTimeHandler.GET, true)
  post('/date-and-time', dateAndTimeHandler.CREATE, DateAndTime)
  get('/repeat', repeatHandler.GET, true)
  post('/repeat', repeatHandler.POST, Repeat)
  get('/repeat-period-and-count', repeatPeriodAndCountHandler.GET, true)
  post('/repeat-period-and-count', repeatPeriodAndCountHandler.POST, RepeatPeriodAndCount)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  router.get(
    '/confirmation/:appointmentId',
    fetchAppointment(activitiesService),
    emptyAppointmentJourneyHandler(true),
    setAppointmentJourneyMode(AppointmentJourneyMode.CREATE),
    asyncMiddleware(confirmationHandler.GET),
  )
  get('/how-to-add-prisoners', howToAddPrisoners.GET, true)
  post('/how-to-add-prisoners', howToAddPrisoners.POST, HowToAddPrisonersForm)
  get('/upload-by-csv', uploadByCsv.GET, true)
  post('/upload-by-csv', uploadByCsv.POST)
  get('/review-prisoners', reviewPrisoners.GET, true)
  post('/review-prisoners', reviewPrisoners.POST)
  get('/review-prisoners/:prisonNumber/remove', reviewPrisoners.REMOVE, true)

  return router
}
