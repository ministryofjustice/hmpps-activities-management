import { Request, Response } from 'express'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner, date, locationCode, preLocationCode, postLocationCode } = req.session.bookAVideoLinkJourney

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
      this.activitiesService.getInternalLocationEvents(
        user.activeCaseLoadId,
        parseIsoDate(date),
        locations.map(l => l.locationId),
        user,
      ),
      this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode, user),
    ])

    return res.render('pages/appointments/video-link-booking/schedule', {
      prisonerScheduledEvents,
      internalLocationEvents,
      rooms,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.params
    const { user } = res.locals
    const { type } = req.session.bookAVideoLinkJourney

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading =
        type === 'COURT'
          ? "You've changed the schedule for this court hearing"
          : "You've changed the schedule for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('extra-information')
  }
}
