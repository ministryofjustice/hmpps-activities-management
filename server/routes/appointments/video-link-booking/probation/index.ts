import { RequestHandler, Router } from 'express'
import { Services } from '../../../../services'
import VideoLinkDetailsRoutes from './handlers/videoLinkDetails'
import insertJourneyIdentifier from '../../../../middleware/insertJourneyIdentifier'
import initialiseJourney from './middleware/initialiseJourney'
import cancelRoutes from './cancelRoutes'
import amendRoutes from './amendRoutes'
import createRoutes from './createRoutes'
import insertRouteContext from '../../../../middleware/routeContext'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  const videoLinkDetailsRoutes = new VideoLinkDetailsRoutes(
    services.bookAVideoLinkService,
    services.activitiesService,
    services.prisonService,
    services.userService,
    services.locationMappingService,
  )

  get('/:vlbId', videoLinkDetailsRoutes.GET)
  router.use('/create/:journeyId', insertRouteContext('create'), createRoutes(services))

  router.use('/amend/:bookingId', insertJourneyIdentifier())
  router.use(
    '/amend/:bookingId/:journeyId',
    insertRouteContext('amend'),
    initialiseJourney(services),
    amendRoutes(services),
  )

  router.use('/cancel/:bookingId', insertJourneyIdentifier())
  router.use(
    '/cancel/:bookingId/:journeyId',
    insertRouteContext('cancel'),
    initialiseJourney(services),
    cancelRoutes(services),
  )

  return router
}
