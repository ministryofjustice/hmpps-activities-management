import { IsEnum, ValidateIf, ValidateNested } from 'class-validator'
import { Request, Response } from 'express'
import { Type } from 'class-transformer'
import { addDays, subDays } from 'date-fns'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import IsValidDate from '../../../../validators/isValidDate'

export enum DateOptions {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  OTHER = 'other',
}

export class NotAttendedDate {
  @IsEnum(DateOptions, { message: 'Select a date option' })
  dateOption: DateOptions

  @ValidateIf(o => o.dateOption === DateOptions.OTHER)
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  @DateIsSameOrAfter(subDays(new Date(), 14), { message: 'Enter a date within the last 14 days' })
  @DateIsSameOrBefore(addDays(new Date(), 60), { message: 'Enter a date up to 60 days in the future' })
  date?: SimpleDate
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/not-attended/select-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const {
      dateOption,
      date,
    }: {
      dateOption: DateOptions
      date: SimpleDate
    } = req.body

    let selectedDate
    if (dateOption === DateOptions.OTHER) {
      selectedDate = date
    } else if (dateOption === DateOptions.YESTERDAY) {
      selectedDate = simpleDateFromDate(addDays(new Date(), -1))
    } else {
      selectedDate = simpleDateFromDate(new Date())
    }

    res.redirect(`attendance?date=${selectedDate.toIsoString()}&status=NotAttended&preserveHistory=true`)
  }
}
