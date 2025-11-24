import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import RemoveDateOptionRoutes, { RemoveDateOption } from './handlers/removeDateOption'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import ConfirmExclusionsRoutes from './handlers/confirmExclusions'
import ChooseEndDateOptionRoutes, { ChooseEndDateOption } from './handlers/chooseEndDateOption'
import DeallocateTodayOptionRoutes, { DeallocateToday } from './handlers/deallocateTodayOptions'
import DeallocationReasonOptionRoutes, { DeallocationReasonOption } from './handlers/deallocationReasonOption'
import DeallocationReasonRoutes, { DeallocationReason } from './handlers/deallocationReason'
import DeallocationCaseNoteRoutes, { DeallocationCaseNote } from './handlers/deallocationCaseNote'
import CheckAnswersRoutes from './handlers/checkAnswers'
import DeallocationCaseNoteQuestionRoutes, {
  DeallocationCaseNoteQuestion,
} from './handlers/deallocationCaseNoteQuestion'
import CancelRoutes, { ConfirmCancelOptions } from './handlers/cancel'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const startDateHandler = new StartDateRoutes(activitiesService)
  const removeDateOptionHandler = new RemoveDateOptionRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const confirmExclusionsHandler = new ConfirmExclusionsRoutes(activitiesService)
  const chooseEndDateOptionHandler = new ChooseEndDateOptionRoutes()
  const endTodayOptionHandler = new DeallocateTodayOptionRoutes()
  const deallocationReasonOptionHandler = new DeallocationReasonOptionRoutes(activitiesService)
  const deallocationReasonHandler = new DeallocationReasonRoutes(activitiesService)
  const caseNoteHandler = new DeallocationCaseNoteRoutes()
  const caseNoteQuestionHandler = new DeallocationCaseNoteQuestionRoutes()
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const cancelHandler = new CancelRoutes()

  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/deallocate-today-option', endTodayOptionHandler.GET, true)
  post('/deallocate-today-option', endTodayOptionHandler.POST, DeallocateToday)
  get('/remove-end-date-option', removeDateOptionHandler.GET, true)
  post('/remove-end-date-option', removeDateOptionHandler.POST, RemoveDateOption)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)
  get('/reason-option', deallocationReasonOptionHandler.GET, true)
  post('/reason-option', deallocationReasonOptionHandler.POST, DeallocationReasonOption)
  get('/reason', deallocationReasonHandler.GET, true)
  post('/reason', deallocationReasonHandler.POST, DeallocationReason)
  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/confirm-exclusions', confirmExclusionsHandler.GET, true)
  post('/confirm-exclusions', confirmExclusionsHandler.POST)
  get('/choose-end-date-option', chooseEndDateOptionHandler.GET, true)
  post('/choose-end-date-option', chooseEndDateOptionHandler.POST, ChooseEndDateOption)
  get('/case-note-question', caseNoteQuestionHandler.GET, true)
  post('/case-note-question', caseNoteQuestionHandler.POST, DeallocationCaseNoteQuestion)
  get('/case-note', caseNoteHandler.GET, true)
  post('/case-note', caseNoteHandler.POST, DeallocationCaseNote)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/cancel', cancelHandler.GET, true)
  post('/cancel', cancelHandler.POST, ConfirmCancelOptions)
  return router
}
