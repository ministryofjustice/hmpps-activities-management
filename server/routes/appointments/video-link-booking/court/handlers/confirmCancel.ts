import { Request, Response } from 'express'
import CourtBookingService from '../../../../../services/courtBookingService'

export default class ConfirmCancelRoutes {
  constructor(private readonly courtBookingService: CourtBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/appointments/video-link-booking/court/confirm-cancel')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    await this.courtBookingService.cancelVideoLinkBooking(req.session.bookACourtHearingJourney, user)

    return res.redirectOrReturn('confirmation')
  }
}
