import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export default class ConfirmationRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals
    req.session.bookAVideoLinkJourney = null

    const vlb = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const court = await this.bookAVideoLinkService
      .getAllCourts(user)
      .then(courts => courts.find(c => c.code === vlb.courtCode))

    return res.render('pages/appointments/video-link-booking/confirmation', { vlb, court })
  }
}
