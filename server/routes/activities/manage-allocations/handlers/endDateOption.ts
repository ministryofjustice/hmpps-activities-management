import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class EndDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want to set the end date.' })
  endDateOption: string
}

export default class EndDateOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate

    res.render('pages/activities/manage-allocations/end-date-option', {
      prisonerName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.endDateOption === 'yes') {
      return res.redirectOrReturn(`end-date`)
    }
    return res.redirectOrReturn(`pay-band`)
  }
}
