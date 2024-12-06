import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import SuspendFromRoutes, { SuspendFrom } from './handlers/suspendFrom'
import SuspensionPayRoutes, { SuspensionPay } from './handlers/pay'
import CaseNoteQuestionRoutes, { CaseNoteQuestion } from './handlers/caseNoteQuestion'
import CaseNoteRoutes, { CaseNote } from './handlers/caseNote'
import CheckAnswersRoutes from './handlers/checkAnswers'
import { Services } from '../../../services'
import ConfirmationRoutes from './handlers/confirmation'

export default function Index({ activitiesService, metricsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('suspendJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const suspendFromHandler = new SuspendFromRoutes()
  const payHandler = new SuspensionPayRoutes()
  const caseNoteQuestionHandler = new CaseNoteQuestionRoutes()
  const caseNoteHandler = new CaseNoteRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const confirmationHandler = new ConfirmationRoutes(metricsService)

  get('/suspend-from', suspendFromHandler.GET, true)
  post('/suspend-from', suspendFromHandler.POST, SuspendFrom)
  get('/pay', payHandler.GET, true)
  post('/pay', payHandler.POST, SuspensionPay)
  get('/case-note-question', caseNoteQuestionHandler.GET, true)
  post('/case-note-question', caseNoteQuestionHandler.POST, CaseNoteQuestion)
  get('/case-note', caseNoteHandler.GET, true)
  post('/case-note', caseNoteHandler.POST, CaseNote)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/confirmation', confirmationHandler.GET)

  return router
}
