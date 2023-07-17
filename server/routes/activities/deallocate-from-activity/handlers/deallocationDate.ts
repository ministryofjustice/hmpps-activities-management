import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsAfter from '../../../../validators/dateIsAfter'
import DateIsSameOrAfterOtherProperty from '../../../../validators/dateIsSameOrAfterOtherProperty'

export class DeallocationDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsAfter(new Date(), { message: "Enter a date after today's date" })
  @DateIsSameOrAfterOtherProperty('startDate', {
    message: 'Enter a date on or after the latest allocation start date',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  deallocationDate: SimpleDate

  @Expose()
  startDate: string
}

export default class DeallocationDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/deallocate-from-activity/deallocation-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationDate } = req.body
    req.session.deallocateJourney.deallocationDate = deallocationDate
    res.redirectOrReturn('reason')
  }
}
