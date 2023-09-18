import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, ValidateIf, ValidateNested } from 'class-validator'
import { format, addDays } from 'date-fns'
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

export default class SelectDateAndLocationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/movement-list/choose-details')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, date, timeSlot } = req.body

    const dateValue = this.getDateValue(dateOption, date)

    return res.redirect(`locations?dateOption=${dateOption}date=${dateValue}&timeSlot=${timeSlot}`)
  }

  private getDateValue = (dateOption: string, date: SimpleDate): string => {
    if (dateOption === DateOption.TODAY) {
      return this.formatDate(new Date())
    }

    if (dateOption === DateOption.TOMORROW) {
      return this.formatDate(addDays(new Date(), 1)).toString()
    }

    return this.formatDate(date.toRichDate())
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
