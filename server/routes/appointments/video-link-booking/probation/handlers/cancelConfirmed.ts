import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'

export default class CancelConfirmedRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { date, probationTeamCode } = req.session.bookAProbationMeetingJourney
    const { user } = res.locals
    req.session.bookAProbationMeetingJourney = null

    const probationTeam = await this.bookAVideoLinkService
      .getAllProbationTeams(user)
      .then(teams => teams.find(t => t.code === probationTeamCode))

    return res.render('pages/appointments/video-link-booking/probation/booking-cancelled', { date, probationTeam })
  }
}
