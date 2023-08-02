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
  datePresetOption: DateOptions

  @ValidateIf(o => o.datePresetOption === DateOptions.OTHER)
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  @DateIsSameOrAfter(() => subDays(new Date(), 14), { message: 'Enter a date within the last 14 days' })
  @DateIsSameOrBefore(() => addDays(new Date(), 60), { message: 'Enter a date up to 60 days in the future' })
  date?: SimpleDate
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/daily-attendance-summary/select-period', {
      title: 'Not attended yet list: select a date',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { datePresetOption, date } = req.body

    let selectedDate
    if (datePresetOption === DateOptions.OTHER) {
      selectedDate = date
    } else if (datePresetOption === DateOptions.YESTERDAY) {
      selectedDate = simpleDateFromDate(addDays(new Date(), -1))
    } else {
      selectedDate = simpleDateFromDate(new Date())
    }

    res.redirect(`attendance?date=${selectedDate.toIsoString()}&status=NotAttended&preserveHistory=true`)
  }
}
