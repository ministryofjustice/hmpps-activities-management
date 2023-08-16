import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate from '../../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../../validators/isValidDate'
import DateIsSameOrBefore from '../../../../../validators/dateIsSameOrBefore'

export class RequestDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrBefore(() => new Date(), { message: 'The date cannot be in the future' })
  @IsValidDate({ message: 'Enter a valid request date' })
  requestDate: SimpleDate
}

export default class RequestDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/request-date`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.waitListApplicationJourney.requestDate = req.body.requestDate
    return res.redirectOrReturn(`activity`)
  }
}
