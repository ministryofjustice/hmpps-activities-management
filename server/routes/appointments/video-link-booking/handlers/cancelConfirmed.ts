import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export default class CancelConfirmedRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { date, agencyCode } = req.session.bookAVideoLinkJourney
    const { user } = res.locals
    req.session.bookAVideoLinkJourney = null

    const agency =
      (await this.bookAVideoLinkService.getAllCourts(user).then(courts => courts.find(c => c.code === agencyCode))) ||
      (await this.bookAVideoLinkService
        .getAllProbationTeams(user)
        .then(teams => teams.find(t => t.code === agencyCode)))

    return res.render('pages/appointments/video-link-booking/booking-cancelled', { date, agency })
  }
}
