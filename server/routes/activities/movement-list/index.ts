import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ChooseDetailsRoutes, { DateAndTimeSlot } from './handlers/chooseDetails'
import LocationsRoutes from './handlers/locations'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const chooseDetailsRoutes = new ChooseDetailsRoutes()
  const locationsRoutes = new LocationsRoutes(activitiesService)

  get('/choose-details', chooseDetailsRoutes.GET)
  post('/choose-details', chooseDetailsRoutes.POST, DateAndTimeSlot)
  get('/locations', locationsRoutes.GET)

  return router
}
