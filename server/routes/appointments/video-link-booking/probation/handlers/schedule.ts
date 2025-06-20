import { Request, Response } from 'express'
import { uniqWith } from 'lodash'
import ActivitiesService from '../../../../../services/activitiesService'
import { parseIsoDate } from '../../../../../utils/datePickerUtils'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'
import ProbationBookingService from '../../../../../services/probationBookingService'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner, prisonCode, date, locationCode } = req.session.bookAProbationMeetingJourney

    const location = await this.prisonService.getInternalLocationByKey(locationCode, user)

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
      this.activitiesService
        .getInternalLocationEvents(user.activeCaseLoadId, parseIsoDate(date), [location.locationId], user)
        .then(events =>
          events.map(l => ({
            ...l,
            events: uniqWith(
              l.events,
              (a, b) => a.scheduledInstanceId === b.scheduledInstanceId && a.appointmentId === b.appointmentId,
            ),
          })),
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
