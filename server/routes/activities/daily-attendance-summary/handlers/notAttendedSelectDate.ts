import { IsDate, IsEnum, ValidateIf } from 'class-validator'
import { Request, Response } from 'express'
import { Transform } from 'class-transformer'
import { addDays, startOfToday, subDays } from 'date-fns'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'

export enum DateOptions {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  OTHER = 'other',
}

export class NotAttendedDate {
  @IsEnum(DateOptions, { message: 'Select a date option' })
  datePresetOption: DateOptions

  @ValidateIf(o => o.datePresetOption === DateOptions.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid date' })
  @DateValidator(thisDate => thisDate >= subDays(startOfToday(), 14), {
    message: 'Enter a date within the last 14 days',
  })
  @DateValidator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  date?: Date
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/daily-attendance-summary/select-period', {
      title: 'Not attended yet list: select a date',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const selectedDate = this.selectedDate(req.body)
    res.redirect(`attendance?date=${formatIsoDate(selectedDate)}&status=NotAttended&preserveHistory=true`)
  }

  private selectedDate(form: NotAttendedDate) {
    if (form.datePresetOption === DateOptions.TODAY) return new Date()
    if (form.datePresetOption === DateOptions.YESTERDAY) return subDays(new Date(), 1)
    return form.date
  }
}
