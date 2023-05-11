import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import StartJourneyRoutes from './handlers/startJourney'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ApplyToRoutes, { ApplyTo } from './handlers/applyTo'
import ConfirmEditRoutes, { ConfirmEdit } from './handlers/confirmEdit'
import HowToAddPrisoners, { HowToAddPrisonersForm } from './handlers/howToAddPrisoners'
import SelectPrisonerRoutes, { PrisonerSearch } from './handlers/selectPrisoner'
import UploadByCSV from './handlers/uploadByCsv'
import UploadPrisonerListRoutes, { PrisonerList } from './handlers/uploadPrisonerList'
import ReviewPrisoners from './handlers/reviewPrisoners'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyEditAppointmentJourneyHandler from '../../../middleware/emptyEditAppointmentJourneyHandler'
import fetchAppointmentOccurrence from '../../../middleware/appointments/fetchAppointmentOccurrence'
import EditAppointmentService from '../../../services/editAppointmentService'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import setAppointmentJourneyMode from '../../../middleware/appointments/setAppointmentJourneyMode'
import { AppointmentJourneyMode } from './appointmentJourney'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'
import PrisonerListCsvParser from '../../../utils/prisonerListCsvParser'

export default function Edit({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      emptyEditAppointmentJourneyHandler(stepRequiresSession),
      setAppointmentJourneyMode(AppointmentJourneyMode.EDIT),
      asyncMiddleware(handler),
    )
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(
      path,
      validationMiddleware(type),
      setAppointmentJourneyMode(AppointmentJourneyMode.EDIT),
      asyncMiddleware(handler),
    )

  const editAppointmentService = new EditAppointmentService(activitiesService)
  const startHandler = new StartJourneyRoutes(editAppointmentService)
  const locationRoutes = new LocationRoutes(activitiesService)
  const dateAndTimeRoutes = new DateAndTimeRoutes(activitiesService)
  const applyToRoutes = new ApplyToRoutes(activitiesService, editAppointmentService)

  // Edit property routes
  router.get(
    '/start/:property',
    fetchAppointment(activitiesService),
    fetchAppointmentOccurrence(activitiesService),
    startHandler.EDIT,
  )
  get('/location', locationRoutes.GET, true)
  post('/location', locationRoutes.EDIT, Location)
  get('/date-and-time', dateAndTimeRoutes.GET, true)
  post('/date-and-time', dateAndTimeRoutes.EDIT, DateAndTime)
  get('/:property/apply-to', applyToRoutes.GET, true)
  post('/:property/apply-to', applyToRoutes.POST, ApplyTo)

  // Remove prisoner routes
  const confirmRemovePrisonerRoutes = new ConfirmEditRoutes(activitiesService, editAppointmentService)

  router.get(
    '/start/:prisonNumber/remove',
    fetchAppointment(activitiesService),
    fetchAppointmentOccurrence(activitiesService),
    startHandler.REMOVE_PRISONER,
  )
  get('/:prisonNumber/remove/confirm', confirmRemovePrisonerRoutes.GET, true)
  post('/:prisonNumber/remove/confirm', confirmRemovePrisonerRoutes.POST, ConfirmEdit)
  get('/:prisonNumber/remove/apply-to', applyToRoutes.GET, true)
  post('/:prisonNumber/remove/apply-to', applyToRoutes.POST, ApplyTo)

  // Add prisoners routes
  const howToAddPrisoners = new HowToAddPrisoners()
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService)
  const uploadByCsv = new UploadByCSV()
  const uploadPrisonerListRoutes = new UploadPrisonerListRoutes(new PrisonerListCsvParser(), prisonService)
  const reviewPrisoners = new ReviewPrisoners(editAppointmentService)

  router.get(
    '/start/prisoners/add',
    fetchAppointment(activitiesService),
    fetchAppointmentOccurrence(activitiesService),
    startHandler.ADD_PRISONERS,
  )
  get('/prisoners/add/how-to-add-prisoners', howToAddPrisoners.GET, true)
  post('/prisoners/add/how-to-add-prisoners', howToAddPrisoners.POST, HowToAddPrisonersForm)
  get('/prisoners/add/select-prisoner', selectPrisonerHandler.GET, true)
  post('/prisoners/add/select-prisoner', selectPrisonerHandler.EDIT, PrisonerSearch)
  get('/prisoners/add/upload-by-csv', uploadByCsv.GET, true)
  post('/prisoners/add/upload-by-csv', uploadByCsv.POST)
  get('/prisoners/add/upload-prisoner-list', uploadPrisonerListRoutes.GET, true)
  router.post(
    '/prisoners/add/upload-prisoner-list',
    setUpMultipartFormDataParsing(),
    validationMiddleware(PrisonerList),
    setAppointmentJourneyMode(AppointmentJourneyMode.CREATE),
    asyncMiddleware(uploadPrisonerListRoutes.EDIT),
  )
  get('/prisoners/add/review-prisoners', reviewPrisoners.GET, true)
  post('/prisoners/add/review-prisoners', reviewPrisoners.EDIT)
  get('/prisoners/add/review-prisoners/:prisonNumber/remove', reviewPrisoners.EDIT_REMOVE, true)
  get('/prisoners/add/confirm', confirmRemovePrisonerRoutes.GET, true)
  post('/prisoners/add/confirm', confirmRemovePrisonerRoutes.POST, ConfirmEdit)
  get('/prisoners/add/apply-to', applyToRoutes.GET, true)
  post('/prisoners/add/apply-to', applyToRoutes.POST, ApplyTo)

  return router
}
