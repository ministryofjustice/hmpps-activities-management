import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'

enum RequesterEnum {
  PRISONER = 'PRISONER',
  GUIDANCE_STAFF = 'GUIDANCE_STAFF',
  OTHER = 'OTHER',
}

export class Requester {
  @Expose()
  @IsIn(Object.values(RequesterEnum), { message: 'Select who made the application' })
  requester: RequesterEnum

  @Expose()
  @ValidateIf(o => o.requester === RequesterEnum.OTHER)
  @IsNotEmpty({ message: 'Select who made the application' })
  otherRequester: string
}

export default class RequesterRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/requester`, {
      RequesterEnum,
      prisonerName: req.session.waitListApplicationJourney.prisoner.name,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { requester, otherRequester } = req.body

    if (requester === RequesterEnum.OTHER) {
      req.session.waitListApplicationJourney.requester = otherRequester
    } else {
      req.session.waitListApplicationJourney.requester =
        requester === RequesterEnum.PRISONER
          ? 'Self-requested'
          : 'IAG or CXK careers information, advice and guidance staff'
    }

    return res.redirectOrReturn(`status`)
  }
}
