import { Request, Response } from 'express'

export default class CancelConfirmedRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { date } = req.session.bookAVideoLinkJourney
    req.session.bookAVideoLinkJourney = null
    return res.render('pages/appointments/video-link-booking/booking-cancelled', { date })
  }
}
