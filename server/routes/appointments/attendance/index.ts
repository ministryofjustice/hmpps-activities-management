import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'
import SummariesRoutes from './handlers/summaries'
import AttendeesRoutes from './handlers/attendees'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import config from '../../../config'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'

export default function Index({ activitiesService, prisonService, userService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))
  const getForJourney = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      emptyJourneyHandler('recordAppointmentAttendanceJourney', stepRequiresSession),
      asyncMiddleware(handler),
    )

  const selectDateRoutes = new SelectDateRoutes()
  const summariesRoutes = new SummariesRoutes(activitiesService, prisonService)
  const attendanceRoutes = new AttendeesRoutes(activitiesService, userService)

  if (config.appointmentMultipleAttendanceToggleEnabled) {
    router.use(insertJourneyIdentifier())

    get('/:journeyId/select-date', selectDateRoutes.GET)
    post('/:journeyId/select-date', selectDateRoutes.POST, SelectDate)
    getForJourney('/:journeyId/summaries', summariesRoutes.GET, true)
    post('/:journeyId/summaries', summariesRoutes.POST)
    getForJourney('/:journeyId/attendees', attendanceRoutes.GET_MULTIPLE, true)
    get('/:journeyId/:appointmentId/attendees', attendanceRoutes.GET_SINGLE)
    post('/:journeyId/attend', attendanceRoutes.ATTEND)
    post('/:journeyId/non-attend', attendanceRoutes.NON_ATTEND)
  } else {
    get('/select-date', selectDateRoutes.GET)
    post('/select-date', selectDateRoutes.POST, SelectDate)
    get('/summaries', summariesRoutes.GET)
  }

  return router
}
