import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ChooseDetailsRoutes, { DateAndTimeSlot } from './handlers/chooseDetails'

export default function Index(): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const chooseDetailsRoutes = new ChooseDetailsRoutes()

  get('/choose-details', chooseDetailsRoutes.GET)
  post('/choose-details', chooseDetailsRoutes.POST, DateAndTimeSlot)

  return router
}
