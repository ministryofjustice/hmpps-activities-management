import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import VideoLinkDetailsRoutes from './handlers/videoLinkDetails'
import config from '../../../config'

export default function Index({
  bookAVideoLinkService,
  activitiesService,
  prisonService,
  userService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const videoLinkDetailsRoutes = new VideoLinkDetailsRoutes(
    bookAVideoLinkService,
    activitiesService,
    prisonService,
    userService,
  )

  // Video link routes are only accessible when running locally or when feature toggle is provided
  router.use((req, res, next) => (!config.bookAVideoLinkToggleEnabled ? next(createHttpError.NotFound()) : next()))

  get('/', videoLinkDetailsRoutes.GET)

  return router
}