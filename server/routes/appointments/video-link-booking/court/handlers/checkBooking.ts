import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import CourtBookingService from '../../../../../services/courtBookingService'

export default class CheckBookingRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly courtBookingService: CourtBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisoner } = req.session.bookACourtHearingJourney

    const [rooms, courts, hearingTypes] = await Promise.all([
      this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode),
      this.bookAVideoLinkService.getAllCourts(),
      this.bookAVideoLinkService.getCourtHearingTypes(),
    ])

    return res.render('pages/appointments/video-link-booking/court/check-booking', { rooms, courts, hearingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const id = await this.courtBookingService.createVideoLinkBooking(req.session.bookACourtHearingJourney)
    return res.redirect(`confirmation/${id}`)
  }
}
