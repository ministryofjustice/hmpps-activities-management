import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export default class CheckBookingRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.session.bookAVideoLinkJourney

    const [rooms, courts, hearingTypes] = await Promise.all([
      this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode, user),
      this.bookAVideoLinkService.getAllCourts(user),
      this.bookAVideoLinkService.getCourtHearingTypes(user),
    ])

    return res.render('pages/appointments/video-link-booking/check-booking', { rooms, courts, hearingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const id = await this.bookAVideoLinkService.createVideoLinkBooking(req.session.bookAVideoLinkJourney, user)
    return res.redirect(`confirmation/${id}`)
  }
}
