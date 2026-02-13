import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ProbationBookingService from '../../../../../services/probationBookingService'

export default class CheckBookingRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisoner } = req.session.bookAProbationMeetingJourney

    const [rooms, probationTeams, meetingTypes] = await Promise.all([
      this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode),
      this.bookAVideoLinkService.getAllProbationTeams(),
      this.bookAVideoLinkService.getProbationMeetingTypes(),
    ])

    return res.render('pages/appointments/video-link-booking/probation/check-booking', {
      rooms,
      probationTeams,
      meetingTypes,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const id = await this.probationBookingService.createVideoLinkBooking(req.session.bookAProbationMeetingJourney)
    return res.redirect(`confirmation/${id}`)
  }
}
