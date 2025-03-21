import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ProbationBookingService from '../../../../../services/probationBookingService'

export default class CheckBookingRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.session.bookAProbationMeetingJourney

    const [rooms, probationTeams, meetingTypes] = await Promise.all([
      this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode, user),
      this.bookAVideoLinkService.getAllProbationTeams(user),
      this.bookAVideoLinkService.getProbationMeetingTypes(user),
    ])

    return res.render('pages/appointments/video-link-booking/probation/check-booking', {
      rooms,
      probationTeams,
      meetingTypes,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const id = await this.probationBookingService.createVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)
    return res.redirect(`confirmation/${id}`)
  }
}
