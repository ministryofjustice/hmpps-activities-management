import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import { SuspendJourney } from '../journey'

export class SuspensionPay {
  @Expose()
  @IsEnum(YesNo, {
    message: args => {
      const { suspendJourney } = args.object as { suspendJourney: SuspendJourney }
      return `Select yes if ${suspendJourney.inmate.prisonerName} should be paid while they’re suspended`
    },
  })
  pay: YesNo
}

export default class SuspensionPayRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/suspensions/pay')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { pay } = req.body
    req.session.suspendJourney.toBePaid = pay

    return res.redirectOrReturn('case-note-question')
  }
}
