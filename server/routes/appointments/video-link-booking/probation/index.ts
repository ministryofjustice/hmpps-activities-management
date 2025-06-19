import { RequestHandler, Router } from 'express'
import { Services } from '../../../../services'
import VideoLinkDetailsRoutes from './handlers/videoLinkDetails'
import insertJourneyIdentifier from '../../../../middleware/insertJourneyIdentifier'
import initialiseJourney from './middleware/initialiseJourney'
import cancelRoutes from './cancelRoutes'
import amendRoutes from './amendRoutes'
import createRoutes from './createRoutes'

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
  router.use('/:mode/:journeyId', (req, res, next) => {
    if (req.params.mode === 'create') {
      createRoutes(services)
    }
    next()
  })

  router.use('/amend/:bookingId', insertJourneyIdentifier())
  router.use('/:mode/:bookingId/:journeyId', (req, res, next) => {
    if (req.params.mode === 'amend') {
      initialiseJourney(services)
      amendRoutes(services)
    }
    next()
  })

  router.use('/cancel/:bookingId', insertJourneyIdentifier())
  router.use('/:mode/:bookingId/:journeyId', (req, res, next) => {
    if (req.params.mode === 'cancel') {
      initialiseJourney(services)
      cancelRoutes(services)
    }
    next()
  })

  return router
}
