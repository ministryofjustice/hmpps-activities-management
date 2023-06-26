import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class EndDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want to specify an end date.' })
  endDateOption: boolean
}

export default class EndDateOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/end-date-option')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.endDateOption = req.body.endDateOption
    if (req.body.endDateOption && req.body.endDateOption === 'yes') {
      res.redirectOrReturn(`end-date`)
    } else {
      res.redirectOrReturn(`days-and-times`)
    }
  }
}
