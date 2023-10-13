import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { startOfToday } from 'date-fns'
import { IsDate } from 'class-validator'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import DateValidator from '../../../../../validators/DateValidator'

export class RequestDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid request date' })
  @DateValidator(date => date <= startOfToday(), { message: 'The request date cannot be in the future' })
  requestDate: Date
}

export default class RequestDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/waitlist-application/request-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.waitListApplicationJourney.requestDate = formatIsoDate(req.body.requestDate)
    res.redirectOrReturn('activity')
  }
}
