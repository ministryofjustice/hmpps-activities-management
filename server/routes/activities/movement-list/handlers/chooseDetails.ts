import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, ValidateIf, ValidateNested } from 'class-validator'
import { addDays } from 'date-fns'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'
import DateOption from '../../../../enum/dateOption'
import TimeSlot from '../../../../enum/timeSlot'

export class DateAndTimeSlot {
  @Expose()
  @IsIn(Object.values(DateOption), { message: 'Select a date for the movement list' })
  dateOption: string

  @Expose()
  @ValidateIf(o => o.dateOption === DateOption.OTHER)
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrBefore(() => addDays(new Date(), 60), { message: 'Enter a date up to 60 days in the future' })
  @IsValidDate({ message: 'Enter a valid date' })
  date: SimpleDate

  @Expose()
  @IsIn(Object.values(TimeSlot), { message: 'Select a time slot' })
  timeSlot: string
}

export default class ChooseDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/movement-list/choose-details')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, timeSlot } = req.body

    const dateQuery = dateOption === DateOption.OTHER ? `&date=${req.body.date.toIsoString()}` : ''

    return res.redirect(`locations?dateOption=${dateOption}${dateQuery}&timeSlot=${timeSlot}`)
  }
}
