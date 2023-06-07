import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import validationMiddleware from '../../middleware/validationMiddleware'
import AllocationDashboardRoutes, { SelectedAllocation, SelectedAllocations } from './handlers/allocationDashboard'
import ActivitiesRoutes from './handlers/activitiesDashboard'
import CheckAllocationRoutes from './handlers/checkAllocation'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const activitiesHandler = new ActivitiesRoutes(activitiesService)
  const allocationDashboardHandler = new AllocationDashboardRoutes(prisonService, activitiesService)
  const checkAllocationHandler = new CheckAllocationRoutes(activitiesService, prisonService)

  get('/', activitiesHandler.GET)
  get('/:activityId', allocationDashboardHandler.GET)
  post('/:activityId/allocate', allocationDashboardHandler.ALLOCATE, SelectedAllocation)
  post('/:activityId/deallocate', allocationDashboardHandler.DEALLOCATE, SelectedAllocations)
  get('/:activityId/check-allocation/:prisonerNumber', checkAllocationHandler.GET)
  post('/:activityId/check-allocation/:prisonerNumber', checkAllocationHandler.POST)
  post('/:activityId/check-allocation', allocationDashboardHandler.UPDATE, SelectedAllocations)

  return router
}
