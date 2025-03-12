import { Request, Response } from 'express'
import ProbationBookingService from '../../../../../services/probationBookingService'

export default class ConfirmCancelRoutes {
  constructor(private readonly probationBookingService: ProbationBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/appointments/video-link-booking/probation/confirm-cancel')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    await this.probationBookingService.cancelVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)

    return res.redirectOrReturn('confirmation')
  }
}
