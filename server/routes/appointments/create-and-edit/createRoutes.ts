import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import emptyAppointmentJourneyHandler from '../../../middleware/emptyAppointmentJourneyHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './handlers/selectPrisoner'
import UploadPrisonerListRoutes, { PrisonerList } from './handlers/uploadPrisonerList'
import NameRoutes, { Name } from './handlers/name'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import RepeatRoutes, { Repeat } from './handlers/repeat'
import RepeatPeriodAndCountRoutes, { RepeatPeriodAndCount } from './handlers/repeatPeriodAndCount'
import CommentRoutes, { Comment } from './handlers/comment'
import AppointmentSetExtraInformationRoutes from './handlers/appointment-set/appointmentSetExtraInformation'
import AppointmentSetAddExtraInformationRoutes, {
  AppointmentSetAppointmentExtraInformation,
} from './handlers/appointment-set/appointmentSetAddExtraInformation'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import HowToAddPrisoners, { HowToAddPrisonersForm } from './handlers/howToAddPrisoners'
import ReviewPrisoners from './handlers/reviewPrisoners'
import { Services } from '../../../services'
import PrisonerListCsvParser from '../../../utils/prisonerListCsvParser'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'
import fetchAppointment from '../../../middleware/appointments/fetchAppointmentSeries'
import EditAppointmentService from '../../../services/editAppointmentService'
import AppointmentSetUploadRoutes, { AppointmentsList } from './handlers/appointment-set/appointmentSetUpload'
import AppointmentSetDateRoutes, { AppointmentSetDate } from './handlers/appointment-set/appointmentSetDate'
import AppointmentSetTimesRoutes, { AppointmentTimes } from './handlers/appointment-set/appointmentSetTimes'
import fetchAppointmentSet from '../../../middleware/appointments/fetchAppointmentSet'
import ScheduleRoutes from './handlers/schedule'

export default function Create({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyAppointmentJourneyHandler(stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const editAppointmentService = new EditAppointmentService(activitiesService)
  const startHandler = new StartJourneyRoutes(prisonService)
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService)
  const uploadPrisonerListRoutes = new UploadPrisonerListRoutes(new PrisonerListCsvParser(), prisonService)
  const nameHandler = new NameRoutes(activitiesService)
  const locationHandler = new LocationRoutes(activitiesService, editAppointmentService)
  const dateAndTimeHandler = new DateAndTimeRoutes()
  const repeatHandler = new RepeatRoutes()
  const repeatPeriodAndCountHandler = new RepeatPeriodAndCountRoutes()
  const commentHandler = new CommentRoutes(editAppointmentService)
  const appointmentSetExtraInformationRoutes = new AppointmentSetExtraInformationRoutes()
  const appointmentSetAddExtraInformationRoutes = new AppointmentSetAddExtraInformationRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes()
  const howToAddPrisoners = new HowToAddPrisoners()
  const reviewPrisoners = new ReviewPrisoners()
  const appointmentSetUploadRoutes = new AppointmentSetUploadRoutes(new PrisonerListCsvParser(), prisonService)
  const appointmentSetDateRoutes = new AppointmentSetDateRoutes()
  const appointmentSetTimesRoutes = new AppointmentSetTimesRoutes()
  const scheduleRoutes = new ScheduleRoutes(activitiesService, editAppointmentService)

  get('/start-individual', startHandler.INDIVIDUAL)
  get('/start-group', startHandler.GROUP)
  get('/start-set', startHandler.SET)
  get('/start-prisoner/:prisonNumber', startHandler.PRISONER)
  get('/select-prisoner', selectPrisonerHandler.GET, true)
  post('/select-prisoner', selectPrisonerHandler.SELECT_PRISONER, SelectPrisoner)
  post('/search-prisoner', selectPrisonerHandler.SEARCH, PrisonerSearch)
  get('/upload-prisoner-list', uploadPrisonerListRoutes.GET, true)
  router.post(
    '/upload-prisoner-list',
    setUpMultipartFormDataParsing(),
    validationMiddleware(PrisonerList),
    asyncMiddleware(uploadPrisonerListRoutes.POST),
  )
  get('/upload-appointment-set', appointmentSetUploadRoutes.GET, true)
  router.post(
    '/upload-appointment-set',
    setUpMultipartFormDataParsing(),
    validationMiddleware(AppointmentsList),
    asyncMiddleware(appointmentSetUploadRoutes.POST),
  )
  get('/name', nameHandler.GET, true)
  post('/name', nameHandler.POST, Name)
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.CREATE, Location)
  get('/date-and-time', dateAndTimeHandler.GET, true)
  post('/date-and-time', dateAndTimeHandler.CREATE, DateAndTime)
  get('/repeat', repeatHandler.GET, true)
  post('/repeat', repeatHandler.POST, Repeat)
  get('/repeat-period-and-count', repeatPeriodAndCountHandler.GET, true)
  post('/repeat-period-and-count', repeatPeriodAndCountHandler.POST, RepeatPeriodAndCount)
  get('/comment', commentHandler.GET, true)
  get('/schedule', scheduleRoutes.GET, true)
  post('/schedule', scheduleRoutes.POST)
  get('/schedule/:prisonNumber/remove', scheduleRoutes.REMOVE, true)
  get('/change', scheduleRoutes.CHANGE)
  get('/appointment-set-extra-information', appointmentSetExtraInformationRoutes.GET, true)
  post('/appointment-set-extra-information', appointmentSetExtraInformationRoutes.POST)
  get('/appointment-set-extra-information/:prisonerNumber', appointmentSetAddExtraInformationRoutes.GET, true)
  post(
    '/appointment-set-extra-information/:prisonerNumber',
    appointmentSetAddExtraInformationRoutes.POST,
    AppointmentSetAppointmentExtraInformation,
  )
  post('/comment', commentHandler.CREATE, Comment)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  router.get(
    '/confirmation/:appointmentId',
    fetchAppointment(activitiesService),
    emptyAppointmentJourneyHandler(true),
    asyncMiddleware(confirmationHandler.GET),
  )
  get('/how-to-add-prisoners', howToAddPrisoners.GET, true)
  post('/how-to-add-prisoners', howToAddPrisoners.POST, HowToAddPrisonersForm)
  get('/review-prisoners', reviewPrisoners.GET, true)
  post('/review-prisoners', reviewPrisoners.POST)
  get('/review-prisoners/:prisonNumber/remove', reviewPrisoners.REMOVE, true)
  get('/appointment-set-date', appointmentSetDateRoutes.GET, true)
  post('/appointment-set-date', appointmentSetDateRoutes.POST, AppointmentSetDate)
  get('/appointment-set-times', appointmentSetTimesRoutes.GET, true)
  post('/appointment-set-times', appointmentSetTimesRoutes.POST, AppointmentTimes)
  router.get(
    '/set-confirmation/:appointmentSetId',
    fetchAppointmentSet(activitiesService),
    emptyAppointmentJourneyHandler(true),
    asyncMiddleware(confirmationHandler.GET_SET),
  )

  return router
}
