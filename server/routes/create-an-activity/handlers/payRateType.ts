import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class PayRateType {
  @Expose()
  @IsNotEmpty({ message: 'Choose what type of rate you want to create.' })
  payRateTypeOption: string
}

export default class PayRateTypeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create-an-activity/pay-rate-type')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.payRateTypeOption = req.body.payRateTypeOption
    res.redirectOrReturn(`pay`)
  }
}
