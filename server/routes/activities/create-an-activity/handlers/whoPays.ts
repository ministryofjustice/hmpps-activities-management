import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { Request, Response } from 'express'

export class WhoPays {
  @Expose()
  @Type(() => String)
  @IsNotEmpty({ message: 'Select who pays prisoners for this activity' })
  type: string
}

export default class WhoPaysRoutes {
  async GET(req: Request, res: Response): Promise<void> {
    res.render('pages/activities/create-an-activity/who-pays')
  }

  async POST(req: Request, res: Response): Promise<void> {
    const { whoPays } = req.body
    req.journeyData.createJourney.whoPays = whoPays

    if (whoPays === 'prison') {
      return res.redirect(`pay-rate-type`)
    }
    req.journeyData.createJourney.qualificationOption = 'no'
    return res.redirectOrReturn(`start-date`)
  }
}
