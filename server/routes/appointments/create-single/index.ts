import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import SelectPrisonerRoutes, { PrisonerSearch } from './handlers/select-prisoner'

export default function Index(): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startHandler = new StartJourneyRoutes()
  const selectPrisonerHandler = new SelectPrisonerRoutes()

  get('/', startHandler.GET)
  get('/select-prisoner', selectPrisonerHandler.GET, true)
  post('/select-prisoner', selectPrisonerHandler.POST, PrisonerSearch)

  return router
}
