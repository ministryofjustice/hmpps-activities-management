import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'
import spikeRoutes from './spikes'

export default function routes(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(homeRoutes())
  router.use(spikeRoutes(services))
  // Add more routes here
  return router
}
