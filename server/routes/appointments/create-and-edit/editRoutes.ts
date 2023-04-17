import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import LocationRoutes, { Location } from './handlers/location'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import fetchAppointmentOccurrence from '../../../middleware/appointments/fetchAppointmentOccurrence'

export default function Edit({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('appointmentJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const locationRoutes = new LocationRoutes(prisonService, activitiesService)

  router.get('/start/:property', fetchAppointmentOccurrence(activitiesService), startHandler.EDIT_OCCURRENCE)

  get('/location', locationRoutes.GET)
  post('/location', locationRoutes.EDIT, Location)

  return router
}
