import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import validationMiddleware from '../../middleware/validationMiddleware'
import AllocationDashboardRoutes, { SelectedAllocation, SelectedAllocations } from './handlers/allocationDashboard'
import ActivitiesRoutes from './handlers/activitiesDashboard'
import CheckAllocationRoutes from './handlers/checkAllocation'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import DeallocationReasonRoutes, { DeallocationReason } from './handlers/deallocationReason'
import PayBandRoutes, { PayBand } from './handlers/payBand'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const activitiesHandler = new ActivitiesRoutes(activitiesService)
  const allocationDashboardHandler = new AllocationDashboardRoutes(prisonService, activitiesService)
  const checkAllocationHandler = new CheckAllocationRoutes(activitiesService, prisonService)
  const startDateHandler = new StartDateRoutes(activitiesService, prisonService)
  const endDateHandler = new EndDateRoutes(activitiesService, prisonService)
  const deallocationReasonHandler = new DeallocationReasonRoutes(activitiesService)
  const payBandHandler = new PayBandRoutes(activitiesService, prisonService)
  const endDateOptionHandler = new EndDateOptionRoutes(activitiesService)

  get('/', activitiesHandler.GET)
  get('/:allocationId/start-date', startDateHandler.GET)
  post('/:allocationId/start-date', startDateHandler.POST, StartDate)
  get('/:allocationId/end-date', endDateHandler.GET)
  post('/:allocationId/end-date', endDateHandler.POST, EndDate)
  get('/:allocationId/reason', deallocationReasonHandler.GET)
  post('/:allocationId/reason', deallocationReasonHandler.POST, DeallocationReason)
  get('/:allocationId/pay-band', payBandHandler.GET)
  post('/:allocationId/pay-band', payBandHandler.POST, PayBand)
  get('/:allocationId/end-date-option', endDateOptionHandler.GET)
  post('/:allocationId/end-date-option', endDateOptionHandler.POST, EndDateOption)
  get('/:activityId', allocationDashboardHandler.GET)
  post('/:activityId/allocate', allocationDashboardHandler.ALLOCATE, SelectedAllocation)
  post('/:activityId/deallocate', allocationDashboardHandler.DEALLOCATE, SelectedAllocations)
  get('/:activityId/check-allocation/:prisonerNumber', checkAllocationHandler.GET)
  post('/:activityId/check-allocation/:prisonerNumber', checkAllocationHandler.POST)
  post('/:activityId/check-allocation', allocationDashboardHandler.UPDATE, SelectedAllocations)

  return router
}
