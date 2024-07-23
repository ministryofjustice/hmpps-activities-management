import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class Prisoner {
  @Expose()
  @IsNotEmpty({ message: 'Select an attendee' })
  prisonerNumber: string
}

export default class SelectPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisoners } = req.session.bookAVideoLinkJourney

    if (prisoners.length > 1) {
      return res.render('pages/appointments/video-link-booking/select-prisoner')
    }

    ;[req.session.bookAVideoLinkJourney.prisoner] = prisoners
    return res.redirect('hearing-details')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.body
    const { prisoners } = req.session.bookAVideoLinkJourney

    req.session.bookAVideoLinkJourney.prisoner = prisoners.find(p => p.number === prisonerNumber)
    return res.redirect('hearing-details')
  }
}
