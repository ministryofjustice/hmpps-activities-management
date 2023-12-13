import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import WaitlistRequester from '../../../../../enum/waitlistRequester'

export class Requester {
  @Expose()
  @IsIn(WaitlistRequester.codes(), { message: 'Select who made the application' })
  requester: string

  @Expose()
  @ValidateIf(o => o.requester === WaitlistRequester.SOMEONE_ELSE.code)
  @IsIn(WaitlistRequester.codes(), { message: 'Select who made the application' })
  otherRequester: string
}

export default class RequesterRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/requester`, {
      prisonerName: req.session.waitListApplicationJourney.prisoner.name,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { requester, otherRequester } = req.body

    req.session.waitListApplicationJourney.requester =
      requester !== WaitlistRequester.SOMEONE_ELSE.code ? requester : otherRequester

    return res.redirectOrReturn(`status`)
  }
}
