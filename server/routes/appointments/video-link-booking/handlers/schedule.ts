import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export default class ScheduleRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner, date } = req.session.bookAVideoLinkJourney

    const scheduledEvents = await this.activitiesService
      .getScheduledEventsForPrisoners(parseIsoDate(date), [prisoner.number], user)
      .then(response => [
        ...response.activities,
        ...response.appointments,
        ...response.courtHearings,
        ...response.visits,
        ...response.externalTransfers,
        ...response.adjudications,
      ])
      .then(events => events.filter(e => !e.cancelled))

    return res.render('pages/appointments/video-link-booking/schedule', { scheduledEvents })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.params
    const { user } = res.locals

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading = "You've changed the schedule for this court hearing"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('extra-information')
  }
}
