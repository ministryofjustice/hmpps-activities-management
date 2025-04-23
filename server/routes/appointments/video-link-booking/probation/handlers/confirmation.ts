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
    req.session.bookAProbationMeetingJourney = null

    const vlb = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const probationTeam = await this.bookAVideoLinkService
      .getAllProbationTeams(user)
      .then(probationTeams => probationTeams.find(p => p.code === vlb.probationTeamCode))

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(vlb.prisonAppointments[0].prisonerNumber, user)

    return res.render('pages/appointments/video-link-booking/probation/confirmation', { vlb, probationTeam, prisoner })
  }
}
