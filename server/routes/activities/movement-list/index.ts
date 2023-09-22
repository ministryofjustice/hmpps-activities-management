import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ChooseDetailsRoutes, { DateAndTimeSlot } from './handlers/chooseDetails'
import LocationsRoutes from './handlers/locations'
import LocationEventsRoutes from './handlers/locationEvents'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const chooseDetailsRoutes = new ChooseDetailsRoutes()
  const locationsRoutes = new LocationsRoutes(activitiesService)
  const locationEventsRoutes = new LocationEventsRoutes(activitiesService, prisonService)

  get('/choose-details', chooseDetailsRoutes.GET)
  post('/choose-details', chooseDetailsRoutes.POST, DateAndTimeSlot)
  get('/locations', locationsRoutes.GET)
  get('/location-events', locationEventsRoutes.GET)

  return router
}
