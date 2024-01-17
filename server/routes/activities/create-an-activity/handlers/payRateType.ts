import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class PayRateType {
  @Expose()
  @IsNotEmpty({
    message:
      'Select if you want to create a pay rate for a single incentive level or a flat rate for all incentive levels',
  })
  payRateTypeOption: string
}

export default class PayRateTypeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/pay-rate-type')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { payRateTypeOption } = req.body
    const { preserveHistory } = req.query
    res.redirect(`pay/${payRateTypeOption}${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
