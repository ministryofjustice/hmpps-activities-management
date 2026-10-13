import { Request, Response } from 'express'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'

export default class CancelConfirmedRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { date, probationTeamCode } = req.journeyData.bookAProbationMeetingJourney
    const { user } = res.locals
    req.journeyData.bookAProbationMeetingJourney = null

    const probationTeam = await this.bookAVideoLinkService
      .getAllProbationTeams(user)
      .then(teams => teams.find(t => t.code === probationTeamCode))

    return res.render('pages/appointments/video-link-booking/probation/booking-cancelled', { date, probationTeam })
  }
}
