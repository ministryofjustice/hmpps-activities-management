import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import { SuspendJourney } from '../journey'
import { activityHasPayBand } from '../utils/suspendUtils'

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
  GET = async (req: Request, res: Response) => {
    res.render('pages/activities/suspensions/pay', {
      extraContent: this.showExtraContent(req.session.suspendJourney.allocations),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { pay } = req.body
    req.session.suspendJourney.toBePaid = pay

    return res.redirectOrReturn('case-note-question')
  }

  private showExtraContent = allocations => {
    if (allocations?.length < 2) return false
    const prisonerPaidForAnyActivity = activityHasPayBand(allocations)
    if (prisonerPaidForAnyActivity) {
      return {
        totalAllocations: allocations.length,
        numberPaid: allocations.filter(al => al.payBand).length,
        paidAllocations: allocations?.filter(allocation => !!allocation.payBand),
      }
    }
    return false
  }
}
