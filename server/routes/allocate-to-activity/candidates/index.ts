import { Router } from 'express'
import identifyCandidatesRoutes from './identify-candidates'
import peopleAllocatedNowRoutes from './people-allocated-now'
import { Services } from '../../../services'

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })
  router.use('/identify-candidates', identifyCandidatesRoutes(services))
  router.use('/people-allocated-now', peopleAllocatedNowRoutes(services))
  return router
}
