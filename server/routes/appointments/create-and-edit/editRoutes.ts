import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import StartJourneyRoutes from './handlers/startJourney'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ScheduleRoutes from './handlers/schedule'
import ExtraInformationRoutes, { ExtraInformation } from './handlers/extraInformation'
import ApplyToRoutes, { ApplyTo } from './handlers/applyTo'
import ConfirmEditRoutes, { ConfirmEdit } from './handlers/confirmEdit'
import HowToAddPrisoners, { HowToAddPrisonersForm } from './handlers/howToAddPrisoners'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './handlers/selectPrisoner'
import UploadPrisonerListRoutes, { PrisonerList } from './handlers/uploadPrisonerList'
import ReviewPrisoners from './handlers/reviewPrisoners'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyEditAppointmentJourneyHandler from '../../../middleware/emptyEditAppointmentJourneyHandler'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import EditAppointmentService from '../../../services/editAppointmentService'
import fetchAppointmentSeries from '../../../middleware/appointments/fetchAppointmentSeries'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'
import PrisonerListCsvParser from '../../../utils/prisonerListCsvParser'
import CancellationReasonRoutes, { CancellationReason } from './handlers/cancellationReason'
import TierRoutes, { TierForm } from './handlers/tier'
import HostRoutes, { HostForm } from './handlers/host'
import ReviewPrisonersAlertsRoutes from './handlers/reviewPrisonersAlerts'
import PrisonerAlertsService from '../../../services/prisonerAlertsService'
import AppointeeAttendeeService from '../../../services/appointeeAttendeeService'
import UncancelRoutes from './handlers/uncancel'
import ReviewNonAssociationRoutes from './handlers/reviewNonAssociations'

export default function Edit({
  prisonService,
  activitiesService,
  metricsService,
  nonAssociationsService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyEditAppointmentJourneyHandler(stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const editAppointmentService = new EditAppointmentService(activitiesService, metricsService)
  const appointeeAttendeeService = new AppointeeAttendeeService(prisonService)
  const startJourneyRoutes = new StartJourneyRoutes(prisonService, metricsService, appointeeAttendeeService)
  const prisonerAlertsService = new PrisonerAlertsService(prisonService)
  const tierRoutes = new TierRoutes(editAppointmentService)
  const hostRoutes = new HostRoutes(editAppointmentService)
  const locationRoutes = new LocationRoutes(activitiesService, editAppointmentService)
  const dateAndTimeRoutes = new DateAndTimeRoutes()
  const scheduleRoutes = new ScheduleRoutes(activitiesService, editAppointmentService, metricsService)
  const extraInformationRoutes = new ExtraInformationRoutes(editAppointmentService)
  const confirmEditRoutes = new ConfirmEditRoutes(editAppointmentService)
  const applyToRoutes = new ApplyToRoutes(editAppointmentService)
  const reviewNonAssociationsRoutes = new ReviewNonAssociationRoutes(nonAssociationsService, prisonService)

  // Cancel routes
  const cancellationReasonRoutes = new CancellationReasonRoutes()

  router.get(
    '/start/cancel',
    fetchAppointment(activitiesService),
    fetchAppointmentSeries(activitiesService),
    startJourneyRoutes.CANCEL,
  )
  get('/cancel/reason', cancellationReasonRoutes.GET, true)
  post('/cancel/reason', cancellationReasonRoutes.POST, CancellationReason)
  get('/cancel/confirm', confirmEditRoutes.GET, true)
  post('/cancel/confirm', confirmEditRoutes.POST, ConfirmEdit)
  get('/cancel/apply-to', applyToRoutes.GET, true)
  post('/cancel/apply-to', applyToRoutes.POST, ApplyTo)

  // Uncancel routes
  const uncancelRoutes = new UncancelRoutes(editAppointmentService)
  router.get(
    '/start/uncancel',
    fetchAppointment(activitiesService),
    fetchAppointmentSeries(activitiesService),
    startJourneyRoutes.UNCANCEL,
  )
  get('/uncancel/confirm', uncancelRoutes.GET, true)
  post('/uncancel/confirm', uncancelRoutes.POST, ConfirmEdit)
  get('/uncancel/apply-to', applyToRoutes.GET, true)
  post('/uncancel/apply-to', applyToRoutes.POST, ApplyTo)

  // Edit property routes
  router.get(
    '/start/:property',
    fetchAppointment(activitiesService),
    fetchAppointmentSeries(activitiesService),
    startJourneyRoutes.EDIT,
  )
  get('/tier', tierRoutes.GET, true)
  post('/tier', tierRoutes.EDIT, TierForm)
  get('/host', hostRoutes.GET, true)
  post('/host', hostRoutes.EDIT, HostForm)
  get('/location', locationRoutes.GET, true)
  post('/location', locationRoutes.EDIT, Location)
  get('/date-and-time', dateAndTimeRoutes.GET, true)
  post('/date-and-time', dateAndTimeRoutes.EDIT, DateAndTime)
  get('/schedule', scheduleRoutes.GET, true)
  post('/schedule', scheduleRoutes.EDIT)
  get('/schedule/:prisonNumber/remove', scheduleRoutes.REMOVE, true)
  get('/schedule/change', scheduleRoutes.CHANGE)
  get('/extra-information', extraInformationRoutes.GET, true)
  post('/extra-information', extraInformationRoutes.EDIT, ExtraInformation)
  get('/:property/apply-to', applyToRoutes.GET, true)
  post('/:property/apply-to', applyToRoutes.POST, ApplyTo)

  // Remove prisoner routes
  router.get(
    '/start/:prisonNumber/remove',
    fetchAppointment(activitiesService),
    fetchAppointmentSeries(activitiesService),
    startJourneyRoutes.REMOVE_PRISONER,
  )
  get('/:prisonNumber/remove/confirm', confirmEditRoutes.GET, true)
  post('/:prisonNumber/remove/confirm', confirmEditRoutes.POST, ConfirmEdit)
  get('/:prisonNumber/remove/apply-to', applyToRoutes.GET, true)
  post('/:prisonNumber/remove/apply-to', applyToRoutes.POST, ApplyTo)

  // Add prisoners routes
  const howToAddPrisoners = new HowToAddPrisoners()
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService)
  const uploadPrisonerListRoutes = new UploadPrisonerListRoutes(new PrisonerListCsvParser(), prisonService)
  const reviewPrisoners = new ReviewPrisoners(metricsService, prisonerAlertsService)
  const reviewPrisonerAlerts = new ReviewPrisonersAlertsRoutes(prisonerAlertsService)

  router.get(
    '/start/prisoners/add',
    fetchAppointment(activitiesService),
    fetchAppointmentSeries(activitiesService),
    startJourneyRoutes.ADD_PRISONERS,
  )
  get('/prisoners/add/how-to-add-prisoners', howToAddPrisoners.GET, true)
  post('/prisoners/add/how-to-add-prisoners', howToAddPrisoners.POST, HowToAddPrisonersForm)
  get('/prisoners/add/select-prisoner', selectPrisonerHandler.GET, true)
  post('/prisoners/add/select-prisoner', selectPrisonerHandler.SELECT_PRISONER, SelectPrisoner)
  post('/prisoners/add/search-prisoner', selectPrisonerHandler.SEARCH, PrisonerSearch)
  get('/prisoners/add/upload-prisoner-list', uploadPrisonerListRoutes.GET, true)
  router.post(
    '/prisoners/add/upload-prisoner-list',
    setUpMultipartFormDataParsing(),
    validationMiddleware(PrisonerList),
    asyncMiddleware(uploadPrisonerListRoutes.EDIT),
  )
  get('/prisoners/add/review-prisoners', reviewPrisoners.GET, true)
  post('/prisoners/add/review-prisoners', reviewPrisoners.EDIT)
  get('/prisoners/add/review-prisoners/:prisonNumber/remove', reviewPrisoners.EDIT_REMOVE, true)
  get('/prisoners/add/review-prisoners-alerts', reviewPrisonerAlerts.GET, true)
  post('/prisoners/add/review-prisoners-alerts', reviewPrisonerAlerts.EDIT)
  get('/prisoners/add/review-prisoners-alerts/:prisonNumber/remove', reviewPrisonerAlerts.EDIT_REMOVE, true)
  get('/prisoners/add/review-non-associations', reviewNonAssociationsRoutes.EDIT_GET, true)
  post('/prisoners/add/review-non-associations', reviewNonAssociationsRoutes.EDIT)
  get('/prisoners/add/review-non-associations/:prisonNumber/remove', reviewNonAssociationsRoutes.EDIT_REMOVE, true)
  get('/prisoners/add/confirm', confirmEditRoutes.GET, true)
  post('/prisoners/add/confirm', confirmEditRoutes.POST, ConfirmEdit)
  get('/prisoners/add/apply-to', applyToRoutes.GET, true)
  post('/prisoners/add/apply-to', applyToRoutes.POST, ApplyTo)

  return router
}
