import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import validationMiddleware from '../../middleware/validationMiddleware'
import AllocationDashboardRoutes, { SelectedAllocation, SelectedAllocations } from './handlers/allocationDashboard'
import ActivitiesRoutes from './handlers/activitiesDashboard'
import CheckAllocationRoutes from './handlers/checkAllocation'

export default function Index({ activitiesService, prisonService, capacitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const activitiesHandler = new ActivitiesRoutes(activitiesService, capacitiesService)
  const allocationDashboardHandler = new AllocationDashboardRoutes(prisonService, capacitiesService, activitiesService)
  const checkAllocationHandler = new CheckAllocationRoutes(activitiesService, prisonService)

  get('/', activitiesHandler.GET)
  get('/:scheduleId', allocationDashboardHandler.GET)
  post('/:scheduleId/allocate', allocationDashboardHandler.ALLOCATE, SelectedAllocation)
  post('/:scheduleId/deallocate', allocationDashboardHandler.DEALLOCATE, SelectedAllocations)
  get('/:scheduleId/check-allocation/:prisonerNumber', checkAllocationHandler.GET)
  post('/:scheduleId/check-allocation/:prisonerNumber', checkAllocationHandler.POST)
  post('/:scheduleId/check-allocation', allocationDashboardHandler.UPDATE, SelectedAllocations)

  return router
}
