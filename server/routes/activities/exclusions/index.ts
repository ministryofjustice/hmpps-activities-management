import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import config from '../../../config'
import ViewAllocationsRoutes from './handlers/viewAllocations'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './handlers/selectPrisoner'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const viewAllocationsHandler = new ViewAllocationsRoutes(services.activitiesService, services.prisonService)
  const selectPrisonerRoutes = new SelectPrisonerRoutes(services.prisonService)

  // Exclusion routes are only accessible when running locally or when feature toggle is provided
  router.use((req, res, next) => (!config.exclusionsFeatureToggleEnabled ? next(createHttpError.NotFound()) : next()))

  get('/prisoner/:prisonerNumber', viewAllocationsHandler.GET)
  get('/select-prisoner', selectPrisonerRoutes.GET)
  post('/search-prisoner', selectPrisonerRoutes.SEARCH, PrisonerSearch)
  post('/select-prisoner', selectPrisonerRoutes.SELECT_PRISONER, SelectPrisoner)

  return router
}
