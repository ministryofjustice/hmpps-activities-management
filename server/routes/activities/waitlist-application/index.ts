import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartJourneyRoutes from './handlers/create/startJourney'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import RequestDateRoutes, { RequestDate } from './handlers/create/requestDate'
import ActivityRoutes, { Activity } from './handlers/create/activity'
import RequesterRoutes, { Requester } from './handlers/create/requester'
import StatusRoutes, { Status } from './handlers/create/status'
import CheckAnswersRoutes from './handlers/create/checkAnswers'
import ConfirmationRoutes from './handlers/create/confirmation'
import ViewApplicationRoutes from './handlers/view-and-edit/viewApplication'
import EditStatusRoutes, { EditStatus } from './handlers/view-and-edit/editStatus'
import EditRequesterRoutes from './handlers/view-and-edit/editRequester'
import EditRequestDateRoutes, { EditRequestDate } from './handlers/view-and-edit/editRequestDate'
import EditCommentRoutes, { Comment } from './handlers/view-and-edit/editComment'
import setUpJourneyData from '../../../middleware/setUpJourneyData'
import ReinstateRoutes, { ReinstateForm } from './handlers/view-and-edit/reinstate'
import ReinstateReasonRoutes, { ReinstateReasonForm } from './handlers/view-and-edit/reinstateReason'

export default function Index({
  prisonService,
  activitiesService,
  userService,
  metricsService,
  tokenStore,
}: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      setUpJourneyData(tokenStore),
      emptyJourneyHandler('waitListApplicationJourney', stepRequiresSession),
      handler,
    )

  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, setUpJourneyData(tokenStore), validationMiddleware(type), handler)

  const startJourneyHandler = new StartJourneyRoutes(prisonService, metricsService)
  const requestDateHandler = new RequestDateRoutes()
  const activityHandler = new ActivityRoutes(activitiesService)
  const requesterHandler = new RequesterRoutes()
  const statusHandler = new StatusRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService, metricsService)
  const confirmationHandler = new ConfirmationRoutes(activitiesService)
  const viewApplicationHandler = new ViewApplicationRoutes(activitiesService, prisonService, userService)
  const editStatusHandler = new EditStatusRoutes(activitiesService)
  const editRequesterHandler = new EditRequesterRoutes(activitiesService)
  const editRequestDateHandler = new EditRequestDateRoutes(activitiesService)
  const editCommentHandler = new EditCommentRoutes(activitiesService)
  const reinstateHandler = new ReinstateRoutes()
  const reinstateReasonHandler = new ReinstateReasonRoutes(activitiesService)

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
  get('/:journeyId/confirmation', confirmationHandler.GET, true)
  get('/:journeyId/view-and-edit/:applicationId/view', viewApplicationHandler.GET)
  get('/:journeyId/view-and-edit/:applicationId/status', editStatusHandler.GET, true)
  post('/:journeyId/view-and-edit/:applicationId/status', editStatusHandler.POST, EditStatus)
  get('/:journeyId/view-and-edit/:applicationId/requester', editRequesterHandler.GET, true)
  post('/:journeyId/view-and-edit/:applicationId/requester', editRequesterHandler.POST, Requester)
  get('/:journeyId/view-and-edit/:applicationId/request-date', editRequestDateHandler.GET, true)
  post('/:journeyId/view-and-edit/:applicationId/request-date', editRequestDateHandler.POST, EditRequestDate)
  get('/:journeyId/view-and-edit/:applicationId/comment', editCommentHandler.GET, true)
  post('/:journeyId/view-and-edit/:applicationId/comment', editCommentHandler.POST, Comment)
  get('/:journeyId/view-and-edit/:applicationId/reinstate', reinstateHandler.GET, true)
  post('/:journeyId/view-and-edit/:applicationId/reinstate', reinstateHandler.POST, ReinstateForm)
  get('/:journeyId/view-and-edit/:applicationId/reinstate-reason', reinstateReasonHandler.GET, true)
  post('/:journeyId/view-and-edit/:applicationId/reinstate-reason', reinstateReasonHandler.POST, ReinstateReasonForm)

  return router
}
