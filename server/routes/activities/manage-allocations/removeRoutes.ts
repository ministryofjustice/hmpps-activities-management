import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import DeallocationReasonRoutes, { DeallocationReason } from './handlers/deallocationReason'
import { Services } from '../../../services'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import CancelRoutes, { ConfirmCancelOptions } from './handlers/cancel'
import DeallocationCaseNoteRoutes, { DeallocationCaseNote } from './handlers/deallocationCaseNote'
import DeallocationCaseNoteQuestionRoutes, {
  DeallocationCaseNoteQuestion,
} from './handlers/deallocationCaseNoteQuestion'

export default function Index({ activitiesService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const cancelHandler = new CancelRoutes()
  const endDateHandler = new EndDateRoutes()
  const deallocationReasonHandler = new DeallocationReasonRoutes(activitiesService)
  const caseNoteHandler = new DeallocationCaseNoteRoutes()
  const caseNoteQuestionHandler = new DeallocationCaseNoteQuestionRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes(metricsService)

  get('/cancel', cancelHandler.GET, true)
  post('/cancel', cancelHandler.POST, ConfirmCancelOptions)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/reason', deallocationReasonHandler.GET, true)
  post('/reason', deallocationReasonHandler.POST, DeallocationReason)
  get('/case-note-question', caseNoteQuestionHandler.GET, true)
  post('/case-note-question', caseNoteQuestionHandler.POST, DeallocationCaseNoteQuestion)
  get('/case-note', caseNoteHandler.GET, true)
  post('/case-note', caseNoteHandler.POST, DeallocationCaseNote)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation', confirmationHandler.GET, true)

  return router
}
