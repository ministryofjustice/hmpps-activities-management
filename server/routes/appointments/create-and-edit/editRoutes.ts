import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import fetchAppointmentOccurrence from '../../../middleware/appointments/fetchAppointmentOccurrence'

export default function Edit({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('appointmentJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const locationRoutes = new LocationRoutes(activitiesService)
  const dateAndTimeRoutes = new DateAndTimeRoutes(activitiesService)

  router.get('/start/:property', fetchAppointmentOccurrence(activitiesService), startHandler.EDIT_OCCURRENCE)

  get('/location', locationRoutes.GET)
  post('/location', locationRoutes.EDIT, Location)
  get('/date-and-time', dateAndTimeRoutes.GET)
  post('/date-and-time', dateAndTimeRoutes.EDIT, DateAndTime)

  return router
}
