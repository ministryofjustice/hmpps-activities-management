import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class Prisoner {
  @Expose()
  @IsNotEmpty({ message: 'Select one attendee for this appointment' })
  prisonerNumber: string
}

export default class SelectPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisoners } = req.session.bookACourtHearingJourney

    if (prisoners.length > 1) {
      return res.render('pages/appointments/video-link-booking/court/select-prisoner')
    }

    ;[req.session.bookACourtHearingJourney.prisoner] = prisoners
    return res.redirect('hearing-details')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.body
    const { prisoners } = req.session.bookACourtHearingJourney

    req.session.bookACourtHearingJourney.prisoner = prisoners.find(p => p.number === prisonerNumber)
    return res.redirect('hearing-details')
  }
}
