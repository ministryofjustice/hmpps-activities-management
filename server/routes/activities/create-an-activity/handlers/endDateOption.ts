import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class EndDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Select if you want to enter an end date' })
  endDateOption: boolean
}

export default class EndDateOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/end-date-option')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.createJourney.endDateOption = req.body.endDateOption
    if (req.body.endDateOption && req.body.endDateOption === 'yes') {
      res.redirectOrReturn(`end-date`)
    } else {
      res.redirectOrReturn('schedule-frequency')
    }
  }
}
