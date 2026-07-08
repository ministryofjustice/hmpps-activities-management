import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { parseIsoDate } from '../../../../../utils/datePickerUtils'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ProbationBookingService from '../../../../../services/probationBookingService'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner, prisonCode, date, locationId } = req.session.bookAProbationMeetingJourney

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
      this.activitiesService.getInternalLocationEventsByDpsLocationId(
        user.activeCaseLoadId,
        parseIsoDate(date),
        locationId,
        user,
      ),
      this.bookAVideoLinkService.getAppointmentLocations(prisonCode, user),
    ])

    return res.render('pages/appointments/video-link-booking/probation/schedule', {
      prisonerScheduledEvents,
      internalLocationEvents,
      rooms,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { mode } = req.routeContext

    if (mode === 'amend') {
      await this.probationBookingService.amendVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)

      const successHeading = "You've changed the schedule for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/probation/${req.session.bookAProbationMeetingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('extra-information')
  }
}
