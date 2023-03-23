import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../validators/dateIsSameOrAfter'
import DateIsBeforeOtherProperty from '../../../validators/dateIsBeforeOtherProperty'
import { formatDate } from '../../../utils/utils'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid start date' })
  @IsValidDate({ message: 'Enter a valid start date' })
  @DateIsSameOrAfter(new Date(), { message: "Enter a date on or after today's date" })
  @DateIsBeforeOtherProperty('endDate', { message: 'Enter a date before the end date' })
  startDate: SimpleDate

  @Expose()
  endDate: string
}

export default class StartDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { session } = req
    res.render('pages/create-an-activity/start-date', {
      endDate: session.createJourney.endDate
        ? formatDate(plainToInstance(SimpleDate, session.createJourney.endDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.startDate = req.body.startDate
    res.redirectOrReturn(`end-date-option`)
  }
}
