import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'

export default class ConfirmationRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals
    req.session.bookACourtHearingJourney = null

    const vlb = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId)
    const [court, prisoner] = await Promise.all([
      this.bookAVideoLinkService.getAllCourts().then(courts => courts.find(c => c.code === vlb.courtCode)),
      this.prisonService.getInmateByPrisonerNumber(vlb.prisonAppointments[0].prisonerNumber, user),
    ])

    return res.render('pages/appointments/video-link-booking/court/confirmation', { vlb, court, prisoner })
  }
}
