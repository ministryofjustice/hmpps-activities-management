import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import CategoriesRoutes from './handlers/categories'
import { Services } from '../../services'
import ActivitiesRoutes from './handlers/activities'
import SchedulesRoutes from './handlers/schedules'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import validationMiddleware from '../../middleware/validationMiddleware'
import AllocationDashboardRoutes, { SelectedAllocation } from './handlers/allocationDashboard'
import StartJourneyRoutes from './handlers/startJourney'
import CheckAnswersRoutes from './handlers/checkAnswers'
import ConfirmationRoutes from './handlers/confirmation'
import emptyJourneyHandler from '../../middleware/emptyJourneyHandler'
import CancelRoutes, { ConfirmCancelOptions } from './handlers/cancel'

export default function Index({ activitiesService, prisonService, capacitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('allocateJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const categoriesHandler = new CategoriesRoutes(activitiesService, capacitiesService)
  const activitiesHandler = new ActivitiesRoutes(activitiesService, capacitiesService)
  const schedulesHandler = new SchedulesRoutes(activitiesService, capacitiesService)
  const allocationDashboardHandler = new AllocationDashboardRoutes(prisonService, capacitiesService, activitiesService)
  const startJourneyHandler = new StartJourneyRoutes(prisonService, activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService)
  const checkAnswersHandler = new CheckAnswersRoutes(activitiesService)
  const cancelHandler = new CancelRoutes()
  const confirmationHandler = new ConfirmationRoutes()

  get('/categories', categoriesHandler.GET)
  get('/categories/:categoryId/activities', activitiesHandler.GET)
  get('/activities/:activityId/schedules', schedulesHandler.GET)
  get('/:scheduleId/allocate', allocationDashboardHandler.GET)
  post('/:scheduleId/allocate', allocationDashboardHandler.POST, SelectedAllocation)
  get('/:scheduleId/allocate/:prisonerNumber', startJourneyHandler.GET)
  get('/pay-band', payBandHandler.GET, true)
  post('/pay-band', payBandHandler.POST, PayBand)
  get('/check-answers', checkAnswersHandler.GET, true)
  post('/check-answers', checkAnswersHandler.POST)
  get('/cancel', cancelHandler.GET, true)
  post('/cancel', cancelHandler.POST, ConfirmCancelOptions)
  get('/confirmation', confirmationHandler.GET, true)

  return router
}
