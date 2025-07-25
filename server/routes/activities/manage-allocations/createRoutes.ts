import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import BeforeYouAllocateRoutes, { ConfirmOptions } from './handlers/beforeYouAllocate'
import validationMiddleware from '../../../middleware/validationMiddleware'
import StartJourneyRoutes from './handlers/startJourney'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import CancelRoutes, { ConfirmCancelOptions } from './handlers/cancel'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import RemoveDateOptionRoutes, { RemoveDateOption } from './handlers/removeDateOption'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import PrisonerListCsvParser from '../../../utils/prisonerListCsvParser'
import ExclusionRoutes, { Schedule } from './handlers/exclusions'
import AllocationErrorRoutes from './handlers/allocationError'
import SetUpPrisonerListMethodRoutes, {
  SetUpPrisonerListForm,
} from './handlers/allocateMultiplePeople/setUpPrisonerListMethod'
import SelectPrisonerRoutes, { PrisonerSearch } from './handlers/allocateMultiplePeople/selectPrisoner'
import UploadPrisonerListRoutes, { UploadPrisonerList } from './handlers/allocateMultiplePeople/uploadPrisonerList'
import setUpMultipartFormDataParsing from '../../../middleware/setUpMultipartFormDataParsing'
import ReviewUploadPrisonerListRoutes from './handlers/allocateMultiplePeople/reviewUploadPrisonerList'
import ActivityRequirementsReviewRoutes from './handlers/allocateMultiplePeople/activityRequirementsReview'
import ReviewSearchPrisonerListRoutes from './handlers/allocateMultiplePeople/reviewSearchPrisonerList'
import CheckAndConfirmMultipleRoutes from './handlers/allocateMultiplePeople/checkAndConfirmMultiple'
import PayBandMultipleRoutes, { PayBandMultipleForm } from './handlers/allocateMultiplePeople/payBandMultiple'
import ConfirmMultipleAllocationsRoutes from './handlers/allocateMultiplePeople/confirmation'
import FromActivityListRoutes from './handlers/allocateMultiplePeople/fromActivityList'

export default function Index({
  activitiesService,
  prisonService,
  metricsService,
  nonAssociationsService,
}: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const startJourneyHandler = new StartJourneyRoutes(prisonService, activitiesService, metricsService)
  const beforeYouAllocateHandler = new BeforeYouAllocateRoutes(activitiesService)
  const startDateHandler = new StartDateRoutes(activitiesService)
  const endDateHandler = new EndDateRoutes()
  const removeDateOptionHandler = new RemoveDateOptionRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const endDateOptionHandler = new EndDateOptionRoutes()
  const exclusionsHandler = new ExclusionRoutes(activitiesService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const cancelHandler = new CancelRoutes()
  const confirmationHandler = new ConfirmationRoutes(metricsService, activitiesService)
  const errorHandler = new AllocationErrorRoutes()
  const setUpPrisonerListHandler = new SetUpPrisonerListMethodRoutes(activitiesService, metricsService)
  const selectPrisonerHandler = new SelectPrisonerRoutes(prisonService, activitiesService, nonAssociationsService)
  const uploadPrisonerListHandler = new UploadPrisonerListRoutes(
    new PrisonerListCsvParser(),
    prisonService,
    activitiesService,
    nonAssociationsService,
  )
  const fromActivityListHandler = new FromActivityListRoutes(prisonService, activitiesService, nonAssociationsService)
  const reviewUploadPrisonerListHandler = new ReviewUploadPrisonerListRoutes(activitiesService)
  const activityRequirementsReviewHandler = new ActivityRequirementsReviewRoutes(activitiesService)
  const reviewSearchPrisonerListHandler = new ReviewSearchPrisonerListRoutes(nonAssociationsService, activitiesService)
  const PayBandMultipleHandler = new PayBandMultipleRoutes(activitiesService)
  const checkAndConfirmMultipleHandler = new CheckAndConfirmMultipleRoutes(activitiesService)
  const confirmMultipleAllocationsHandler = new ConfirmMultipleAllocationsRoutes(metricsService)

  get('/prisoner/:prisonerNumber', startJourneyHandler.GET)
  get('/before-you-allocate', beforeYouAllocateHandler.GET, true)
  post('/before-you-allocate', beforeYouAllocateHandler.POST, ConfirmOptions)
  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/remove-end-date-option', removeDateOptionHandler.GET, true)
  post('/remove-end-date-option', removeDateOptionHandler.POST, RemoveDateOption)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)
  get('/end-date-option', endDateOptionHandler.GET, true)
  post('/end-date-option', endDateOptionHandler.POST, EndDateOption)
  get('/exclusions', exclusionsHandler.GET, true)
  post('/exclusions', exclusionsHandler.POST, Schedule)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/cancel', cancelHandler.GET, true)
  post('/cancel', cancelHandler.POST, ConfirmCancelOptions)
  get('/confirmation', confirmationHandler.GET, true)

  get('/multiple/set-up-method', setUpPrisonerListHandler.GET, false)
  post('/multiple/set-up-method', setUpPrisonerListHandler.POST, SetUpPrisonerListForm)
  get('/multiple/select-prisoner', selectPrisonerHandler.GET, true)
  post('/multiple/select-prisoner', selectPrisonerHandler.SELECT_PRISONER)
  post('/multiple/search-prisoner', selectPrisonerHandler.SEARCH, PrisonerSearch)
  get('/multiple/review-search-prisoner-list', reviewSearchPrisonerListHandler.GET, true)
  post('/multiple/review-search-prisoner-list', reviewSearchPrisonerListHandler.POST)
  get('/multiple/review-search-prisoner-list/:prisonerNumber/remove', reviewSearchPrisonerListHandler.REMOVE, true)
  get('/multiple/upload-prisoner-list', uploadPrisonerListHandler.GET, true)
  router.post(
    '/multiple/upload-prisoner-list',
    setUpMultipartFormDataParsing(),
    validationMiddleware(UploadPrisonerList),
    uploadPrisonerListHandler.POST,
  )
  get('/multiple/from-activity-list', fromActivityListHandler.GET, true)
  post('/multiple/from-activity-list', fromActivityListHandler.POST)
  get('/multiple/review-upload-prisoner-list', reviewUploadPrisonerListHandler.GET, true)
  get('/multiple/review-upload-prisoner-list/:prisonNumber/remove', reviewUploadPrisonerListHandler.REMOVE, true)
  post('/multiple/review-upload-prisoner-list', reviewUploadPrisonerListHandler.POST)
  get('/multiple/activity-requirements-review', activityRequirementsReviewHandler.GET, true)
  post('/multiple/activity-requirements-review', activityRequirementsReviewHandler.POST)
  get('/multiple/activity-requirements-review/:prisonerNumber/remove', activityRequirementsReviewHandler.REMOVE, true)
  get('/multiple/pay-band-multiple', PayBandMultipleHandler.GET, true)
  post('/multiple/pay-band-multiple', PayBandMultipleHandler.POST, PayBandMultipleForm)
  get('/multiple/check-answers', checkAndConfirmMultipleHandler.GET, true)
  post('/multiple/check-answers', checkAndConfirmMultipleHandler.POST)
  get('/multiple/confirmation', confirmMultipleAllocationsHandler.GET, true)

  get('/error/:errorType', errorHandler.GET, true)
  return router
}
