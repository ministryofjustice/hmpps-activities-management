import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ApplyToRoutes, { ApplyTo } from './handlers/applyTo'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import fetchAppointmentOccurrence from '../../../middleware/appointments/fetchAppointmentOccurrence'
import EditAppointmentUtils from '../../../utils/helpers/editAppointmentUtils'
import fetchAppointment from '../../../middleware/appointments/fetchAppointment'

export default function Edit({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('appointmentJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const editAppointmentUtils = new EditAppointmentUtils(activitiesService)
  const startHandler = new StartJourneyRoutes()
  const locationRoutes = new LocationRoutes(activitiesService)
  const dateAndTimeRoutes = new DateAndTimeRoutes(activitiesService)
  const applyToRoutes = new ApplyToRoutes(activitiesService, editAppointmentUtils)

  router.get(
    '/start/:property',
    fetchAppointment(activitiesService),
    fetchAppointmentOccurrence(activitiesService),
    startHandler.EDIT_OCCURRENCE,
  )

  get('/location', locationRoutes.GET)
  post('/location', locationRoutes.EDIT, Location)
  get('/date-and-time', dateAndTimeRoutes.GET)
  post('/date-and-time', dateAndTimeRoutes.EDIT, DateAndTime)
  get('/:property/apply-to', applyToRoutes.GET)
  post('/:property/apply-to', applyToRoutes.POST, ApplyTo)

  return router
}
