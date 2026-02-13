import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'

export default class CancelConfirmedRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { date, courtCode } = req.session.bookACourtHearingJourney
    req.session.bookACourtHearingJourney = null

    const court = await this.bookAVideoLinkService.getAllCourts().then(courts => courts.find(c => c.code === courtCode))

    return res.render('pages/appointments/video-link-booking/court/booking-cancelled', { date, court })
  }
}
