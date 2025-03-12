import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'

export default class ConfirmCancelRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/appointments/video-link-booking/court/confirm-cancel')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    await this.bookAVideoLinkService.cancelVideoLinkBooking(req.session.bookACourtHearingJourney, user)

    return res.redirectOrReturn('confirmation')
  }
}
