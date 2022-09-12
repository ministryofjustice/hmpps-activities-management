import { Router } from 'express'
import type { Services } from '../services'
import homeRoutes from './home'

// Services wil be passed for most routes - to come
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(service: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(homeRoutes())
  // Add more routes here
  return router
}
