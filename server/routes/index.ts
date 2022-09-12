import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'

export default function routes(service: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(homeRoutes())
  // Add more routes here
  return router
}
