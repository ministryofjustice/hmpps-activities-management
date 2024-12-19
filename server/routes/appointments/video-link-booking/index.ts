import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import VideoLinkDetailsRoutes from './handlers/videoLinkDetails'
import createRoutes from './createRoutes'
import amendRoutes from './amendRoutes'
import cancelRoutes from './cancelRoutes'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseJourney from './middleware/initialiseJourney'

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
  router.use('/:mode(create)/:journeyId', createRoutes(services))

  router.use('/:mode(amend)/:bookingId', insertJourneyIdentifier())
  router.use('/:mode(amend)/:bookingId/:journeyId', initialiseJourney(services), amendRoutes(services))

  router.use('/:mode(cancel)/:bookingId', insertJourneyIdentifier())
  router.use('/:mode(cancel)/:bookingId/:journeyId', initialiseJourney(services), cancelRoutes(services))

  return router
}
