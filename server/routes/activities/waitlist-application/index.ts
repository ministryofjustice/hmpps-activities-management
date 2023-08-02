import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/startJourney'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import RequestDateRoutes, { RequestDate } from './handlers/requestDate'
import ActivityRoutes, { Activity } from './handlers/activity'
import RequesterRoutes, { Requester } from './handlers/requester'
import StatusRoutes, { Status } from './handlers/status'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'

export default function Index({ prisonService, activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('waitListApplicationJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const startJourneyHandler = new StartJourneyRoutes(prisonService)
  const requestDateHandler = new RequestDateRoutes()
  const activityHandler = new ActivityRoutes(activitiesService)
  const requesterHandler = new RequesterRoutes()
  const statusHandler = new StatusRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes()
  const confirmationHandler = new ConfirmationRoutes(activitiesService)

  router.use(insertJourneyIdentifier())
  get('/:journeyId/:prisonerNumber/apply', startJourneyHandler.GET)
  get('/:journeyId/request-date', requestDateHandler.GET, true)
  post('/:journeyId/request-date', requestDateHandler.POST, RequestDate)
  get('/:journeyId/activity', activityHandler.GET, true)
  post('/:journeyId/activity', activityHandler.POST, Activity)
  get('/:journeyId/requester', requesterHandler.GET, true)
  post('/:journeyId/requester', requesterHandler.POST, Requester)
  get('/:journeyId/status', statusHandler.GET, true)
  post('/:journeyId/status', statusHandler.POST, Status)
  get('/:journeyId/check-answers', checkAnswersHandler.GET, true)
  post('/:journeyId/check-answers', checkAnswersHandler.POST)
  get('/:journeyId/confirmation', confirmationHandler.GET)

  return router
}
