import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsAfterOtherProperty from '../../../../validators/dateIsAfterOtherProperty'
import { formatDate } from '../../../../utils/utils'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid end date' })
  @IsValidDate({ message: 'Enter a valid end date' })
  @DateIsAfterOtherProperty('startDate', { message: 'Enter a date after the start date' })
  endDate: SimpleDate

  @Expose()
  startDate: string
}

export default class EndDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { session } = req
    res.render('pages/manage-schedules/create-schedule/end-date', {
      startDate: session.createScheduleJourney.startDate
        ? formatDate(plainToInstance(SimpleDate, session.createScheduleJourney.startDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createScheduleJourney.endDate = req.body.endDate
    res.redirectOrReturn(`days-and-times`)
  }
}
