import { Request, Response } from 'express'
import _ from 'lodash'
import ActivitiesService from '../../../../../services/activitiesService'
import { parseIsoDate } from '../../../../../utils/datePickerUtils'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import CourtBookingService from '../../../../../services/courtBookingService'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly courtBookingService: CourtBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner, prisonCode, date, locationId, preLocationId, postLocationId } =
      req.session.bookACourtHearingJourney

    const uniqueLocationIds = _.uniq([locationId, preLocationId, postLocationId].filter(Boolean))

    const [prisonerScheduledEvents, internalLocationEvents, rooms] = await Promise.all([
      this.activitiesService
        .getScheduledEventsForPrisoners(parseIsoDate(date), [prisoner.number], user)
        .then(response => [
          ...response.activities,
          ...response.appointments,
          ...response.courtHearings,
          ...response.visits,
          ...response.externalTransfers,
          ...response.adjudications,
        ]),
      Promise.all(
        uniqueLocationIds.map(location =>
          this.activitiesService.getInternalLocationEventsByDpsLocationId(
            user.activeCaseLoadId,
            parseIsoDate(date),
            location,
            user,
          ),
        ),
      ),
      this.bookAVideoLinkService.getAppointmentLocations(prisonCode, user),
    ])

    return res.render('pages/appointments/video-link-booking/court/schedule', {
      prisonerScheduledEvents,
      internalLocationEvents,
      rooms,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.routeContext
    const { user } = res.locals

    if (mode === 'amend') {
      await this.courtBookingService.amendVideoLinkBooking(req.session.bookACourtHearingJourney, user)

      const successHeading = "You've changed the schedule for this court hearing"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/court/${req.session.bookACourtHearingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('court-hearing-link')
  }
}
