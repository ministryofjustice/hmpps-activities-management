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
import RepeatFrequencyAndCountRoutes, { RepeatFrequencyAndCount } from './handlers/repeatFrequencyAndCount'
import ExtraInformationRoutes, { ExtraInformation } from './handlers/extraInformation'
import AppointmentSetExtraInformationRoutes from './handlers/appointment-set/appointmentSetExtraInformation'
import AppointmentSetAddExtraInformationRoutes, {
  AppointmentSetAppointmentExtraInformation,
} from './handlers/appointment-set/appointmentSetAddExtraInformation'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import HowToAddPrisonerRoutes, { HowToAddPrisonersForm } from './handlers/howToAddPrisoners'
import ReviewPrisonerRoutes from './handlers/reviewPrisoners'
import { Services } from '../../../services'
import PrisonerListCsvParser from '../../../utils/prisonerListCsvParser'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import EditAppointmentService from '../../../services/editAppointmentService'
import AppointmentSetUploadRoutes, { AppointmentsList } from './handlers/appointment-set/appointmentSetUpload'
import AppointmentSetDateRoutes, { AppointmentSetDate } from './handlers/appointment-set/appointmentSetDate'
import AppointmentSetTimesRoutes, { AppointmentTimes } from './handlers/appointment-set/appointmentSetTimes'
import fetchAppointmentSet from '../../../middleware/appointments/fetchAppointmentSet'
import ScheduleRoutes from './handlers/schedule'
import TierRoutes, { TierForm } from './handlers/tier'
import HostRoutes, { HostForm } from './handlers/host'
import CopySeries, { HowToCopySeriesForm } from './handlers/copySeries'
import NoAttendees from './handlers/noAttendees'
import ReviewPrisonersAlertsRoutes from './handlers/reviewPrisonersAlerts'
import ReviewNonAssociationsRoutes from './handlers/reviewNonAssociations'
import fetchAppointmentSeries from '../../../middleware/appointments/fetchAppointmentSeries'
import AppointeeAttendeeService from '../../../services/appointeeAttendeeService'
import ConfirmNonAssociationRoutes from './handlers/confirmNonAssociations'

export default function Create({
  prisonService,
  activitiesService,
  metricsService,
  nonAssociationsService,
  alertsService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyAppointmentJourneyHandler(stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object, stepRequiresSession = false) =>
    router.post(
      path,
      emptyAppointmentJourneyHandler(stepRequiresSession),
      validationMiddleware(type),
      asyncMiddleware(handler),
    )

  const editAppointmentService = new EditAppointmentService(activitiesService, metricsService)
  const appointeeAttendeeService = new AppointeeAttendeeService(prisonService)
  const startJourneyRoutes = new StartJourneyRoutes(prisonService, metricsService, appointeeAttendeeService)
  const selectPrisonerRoutes = new SelectPrisonerRoutes(prisonService)
  const uploadPrisonerListRoutes = new UploadPrisonerListRoutes(new PrisonerListCsvParser(), prisonService)
  const nameRoutes = new NameRoutes(activitiesService)
  const tierRoutes = new TierRoutes(editAppointmentService)
  const hostRoutes = new HostRoutes(editAppointmentService)
  const locationRoutes = new LocationRoutes(activitiesService, editAppointmentService)
  const dateAndTimeRoutes = new DateAndTimeRoutes()
  const repeatRoutes = new RepeatRoutes()
  const repeatFrequencyAndCountRoutes = new RepeatFrequencyAndCountRoutes()
  const extraInformationRoutes = new ExtraInformationRoutes(editAppointmentService)
  const appointmentSetExtraInformationRoutes = new AppointmentSetExtraInformationRoutes()
  const appointmentSetAddExtraInformationRoutes = new AppointmentSetAddExtraInformationRoutes()
  const checkAnswersRoutes = new CheckAnswersRoutes(activitiesService)
  const confirmationRoutes = new ConfirmationRoutes(metricsService)
  const howToAddPrisonerRoutes = new HowToAddPrisonerRoutes()
  const reviewPrisonerRoutes = new ReviewPrisonerRoutes(metricsService, alertsService)
  const appointmentSetUploadRoutes = new AppointmentSetUploadRoutes(new PrisonerListCsvParser(), prisonService)
  const appointmentSetDateRoutes = new AppointmentSetDateRoutes()
  const appointmentSetTimesRoutes = new AppointmentSetTimesRoutes()
  const scheduleRoutes = new ScheduleRoutes(activitiesService, editAppointmentService, metricsService)
  const reviewPrisonerAlerts = new ReviewPrisonersAlertsRoutes(alertsService)
  const reviewNonAssociations = new ReviewNonAssociationsRoutes(nonAssociationsService, prisonService)
  const confirmNonAssociations = new ConfirmNonAssociationRoutes(nonAssociationsService)
  const copySeriesRoutes = new CopySeries()
  const noAttendeesRoutes = new NoAttendees()

  get('/start-group', startJourneyRoutes.GROUP)
  get('/start-set', startJourneyRoutes.SET)
  get('/start-prisoner/:prisonNumber', startJourneyRoutes.PRISONER)
  get('/select-prisoner', selectPrisonerRoutes.GET, true)
  post('/select-prisoner', selectPrisonerRoutes.SELECT_PRISONER, SelectPrisoner, true)
  post('/search-prisoner', selectPrisonerRoutes.SEARCH, PrisonerSearch)
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
  get('/name', nameRoutes.GET, true)
  post('/name', nameRoutes.POST, Name, true)
  get('/tier', tierRoutes.GET, true)
  post('/tier', tierRoutes.CREATE, TierForm, true)
  get('/host', hostRoutes.GET, true)
  post('/host', hostRoutes.CREATE, HostForm, true)
  get('/location', locationRoutes.GET, true)
  post('/location', locationRoutes.CREATE, Location, true)
  get('/date-and-time', dateAndTimeRoutes.GET, true)
  post('/date-and-time', dateAndTimeRoutes.CREATE, DateAndTime, true)
  get('/repeat', repeatRoutes.GET, true)
  post('/repeat', repeatRoutes.POST, Repeat, true)
  get('/repeat-frequency-and-count', repeatFrequencyAndCountRoutes.GET, true)
  post('/repeat-frequency-and-count', repeatFrequencyAndCountRoutes.POST, RepeatFrequencyAndCount, true)
  get('/extra-information', extraInformationRoutes.GET, true)
  get('/schedule', scheduleRoutes.GET, true)
  post('/schedule', scheduleRoutes.POST, undefined, true)
  get('/schedule/:prisonNumber/remove', scheduleRoutes.REMOVE, true)
  get('/schedule/change', scheduleRoutes.CHANGE)
  get('/appointment-set-extra-information', appointmentSetExtraInformationRoutes.GET, true)
  post('/appointment-set-extra-information', appointmentSetExtraInformationRoutes.POST)
  get('/appointment-set-extra-information/:prisonerNumber', appointmentSetAddExtraInformationRoutes.GET, true)
  post(
    '/appointment-set-extra-information/:prisonerNumber',
    appointmentSetAddExtraInformationRoutes.POST,
    AppointmentSetAppointmentExtraInformation,
    true,
  )
  post('/extra-information', extraInformationRoutes.CREATE, ExtraInformation, true)
  get('/check-answers', checkAnswersRoutes.GET, true)
  post('/check-answers', checkAnswersRoutes.POST, undefined, true)
  router.get(
    '/confirmation/:appointmentId',
    fetchAppointment(activitiesService),
    emptyAppointmentJourneyHandler(true),
    asyncMiddleware(confirmationRoutes.GET),
  )
  get('/how-to-add-prisoners', howToAddPrisonerRoutes.GET, true)
  post('/how-to-add-prisoners', howToAddPrisonerRoutes.POST, HowToAddPrisonersForm)
  get('/review-prisoners', reviewPrisonerRoutes.GET, true)
  post('/review-prisoners', reviewPrisonerRoutes.POST, undefined, true)
  get('/review-prisoners/:prisonNumber/remove', reviewPrisonerRoutes.REMOVE, true)
  post('/review-prisoners-alerts', reviewPrisonerAlerts.POST, undefined, true)
  get('/review-prisoners-alerts', reviewPrisonerAlerts.GET, true)
  get('/review-prisoners-alerts/:prisonNumber/remove', reviewPrisonerAlerts.REMOVE, true)
  get('/review-non-associations', reviewNonAssociations.GET, true)
  post('/review-non-associations', reviewNonAssociations.POST)
  get('/review-non-associations/:prisonNumber/remove', reviewNonAssociations.REMOVE, true)
  get('/confirm-non-associations', confirmNonAssociations.GET, true)
  post('/confirm-non-associations', confirmNonAssociations.POST)
  get('/appointment-set-date', appointmentSetDateRoutes.GET, true)
  post('/appointment-set-date', appointmentSetDateRoutes.POST, AppointmentSetDate, true)
  get('/appointment-set-times', appointmentSetTimesRoutes.GET, true)
  post('/appointment-set-times', appointmentSetTimesRoutes.POST, AppointmentTimes, true)
  router.get(
    '/set-confirmation/:appointmentSetId',
    fetchAppointmentSet(activitiesService),
    emptyAppointmentJourneyHandler(true),
    asyncMiddleware(confirmationRoutes.GET_SET),
  )

  router.get(
    '/start-copy/:appointmentId',
    fetchAppointment(activitiesService),
    fetchAppointmentSeries(activitiesService),
    startJourneyRoutes.COPY,
  )

  get('/copy-series', copySeriesRoutes.GET, true)
  post('/copy-series', copySeriesRoutes.POST, HowToCopySeriesForm, true)
  get('/no-attendees', noAttendeesRoutes.GET, true)
  post('/no-attendees', noAttendeesRoutes.POST)

  return router
}
