import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import { Services } from '../../../../services'
import VideoLinkDetailsRoutes from './handlers/videoLinkDetails'
import insertJourneyIdentifier from '../../../../middleware/insertJourneyIdentifier'
import initialiseJourney from './middleware/initialiseJourney'
import cancelRoutes from './cancelRoutes'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const videoLinkDetailsRoutes = new VideoLinkDetailsRoutes(
    services.bookAVideoLinkService,
    services.activitiesService,
    services.prisonService,
    services.userService,
    services.locationMappingService,
  )

  get('/:vlbId(\\d+)', videoLinkDetailsRoutes.GET)

  router.use('/:mode(cancel)/:bookingId', insertJourneyIdentifier())
  router.use('/:mode(cancel)/:bookingId/:journeyId', initialiseJourney(services), cancelRoutes(services))

  return router
}
