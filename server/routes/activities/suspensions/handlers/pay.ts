import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'

export class SuspensionPay {
  @Expose()
  //   TODO: work out how to put prisoner name in message?
  @IsEnum(YesNo, { message: 'Select yes if [name] should be paid while they’re suspended' })
  payOption: YesNo
}

export default class SuspensionPayRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/suspensions/pay')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { pay } = req.body
    req.session.suspendJourney.suspendFrom = pay

    return res.redirectOrReturn('case-note-question')
  }
}
