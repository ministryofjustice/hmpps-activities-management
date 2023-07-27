import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn } from 'class-validator'
import { isBlank } from '../../../../utils/utils'

enum StatusEnum {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
}

export class Status {
  @Expose()
  @IsIn(Object.values(StatusEnum), { message: 'Select a status for the application' })
  status: StatusEnum

  @Expose()
  @Transform(({ value }) => (isBlank(value) ? undefined : value))
  comment: string
}

export default class StatusRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/status`, { StatusEnum })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.waitListApplicationJourney.status = req.body.status
    req.session.waitListApplicationJourney.comment = req.body.comment
    return res.redirect(`check-answers`)
  }
}
