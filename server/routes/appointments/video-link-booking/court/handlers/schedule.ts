import { Request, Response } from 'express'
import _, { uniqWith } from 'lodash'
import ActivitiesService from '../../../../../services/activitiesService'
import { parseIsoDate } from '../../../../../utils/datePickerUtils'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'
import CourtBookingService from '../../../../../services/courtBookingService'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly courtBookingService: CourtBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner, prisonCode, date, locationCode, preLocationCode, postLocationCode } =
      req.session.bookACourtHearingJourney

    const locations = await Promise.all(
      _.uniq([locationCode, preLocationCode, postLocationCode])
        .filter(Boolean)
        .map(code => this.prisonService.getInternalLocationByKey(code, user)),
    )

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
        .getInternalLocationEvents(
          user.activeCaseLoadId,
          parseIsoDate(date),
          locations.map(l => l.locationId),
          user,
        )
        .then(events =>
          events.map(location => ({
            ...location,
            events: uniqWith(
              location.events,
              (a, b) => a.scheduledInstanceId === b.scheduledInstanceId && a.appointmentId === b.appointmentId,
            ),
          })),
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
    const { mode } = req.params
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
