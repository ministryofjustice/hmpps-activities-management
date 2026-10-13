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
    const { prisoners } = req.journeyData.bookACourtHearingJourney

    if (prisoners.length > 1) {
      return res.render('pages/appointments/video-link-booking/court/select-prisoner')
    }

    const [prisoner] = prisoners
    req.journeyData.bookACourtHearingJourney.prisoner = prisoner
    req.journeyData.bookACourtHearingJourney.prisonCode = prisoner.prisonCode
    return res.redirect('hearing-details')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { prisonerNumber } = req.body
    const { prisoners } = req.journeyData.bookACourtHearingJourney

    const prisoner = prisoners.find(p => p.number === prisonerNumber)

    req.journeyData.bookACourtHearingJourney.prisoner = prisoner
    req.journeyData.bookACourtHearingJourney.prisonCode = prisoner.prisonCode
    return res.redirect('hearing-details')
  }
}
