import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ApplyToRoutes, { ApplyTo } from './handlers/applyTo'
import ConfirmRemovePrisonerRoutes, { ConfirmRemovePrisoner } from './handlers/confirmRemovePrisoner'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyEditAppointmentJourneyHandler from '../../../middleware/emptyEditAppointmentJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import fetchAppointmentOccurrence from '../../../middleware/appointments/fetchAppointmentOccurrence'
import EditAppointmentService from '../../../services/editAppointmentService'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'
import setAppointmentJourneyMode from '../../../middleware/appointments/setAppointmentJourneyMode'
import { AppointmentJourneyMode } from './appointmentJourney'

export default function Edit({ activitiesService }: Services): Router {
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
  const confirmRemovePrisonerRoutes = new ConfirmRemovePrisonerRoutes(activitiesService, editAppointmentService)

  router.get(
    '/start/:property',
    fetchAppointment(activitiesService),
    fetchAppointmentOccurrence(activitiesService),
    startHandler.EDIT_OCCURRENCE,
  )

  router.get(
    '/start/:prisonNumber/remove',
    fetchAppointment(activitiesService),
    fetchAppointmentOccurrence(activitiesService),
    startHandler.REMOVE_PRISONER_FROM_OCCURRENCE,
  )

  get('/location', locationRoutes.GET, true)
  post('/location', locationRoutes.EDIT, Location)
  get('/date-and-time', dateAndTimeRoutes.GET, true)
  post('/date-and-time', dateAndTimeRoutes.EDIT, DateAndTime)
  get('/:property/apply-to', applyToRoutes.GET, true)
  post('/:property/apply-to', applyToRoutes.POST, ApplyTo)
  get('/:prisonNumber/remove/confirm', confirmRemovePrisonerRoutes.GET, true)
  post('/:prisonNumber/remove/confirm', confirmRemovePrisonerRoutes.POST, ConfirmRemovePrisoner)
  get('/:prisonNumber/remove/apply-to', applyToRoutes.GET, true)
  post('/:prisonNumber/remove/apply-to', applyToRoutes.POST, ApplyTo)

  return router
}
