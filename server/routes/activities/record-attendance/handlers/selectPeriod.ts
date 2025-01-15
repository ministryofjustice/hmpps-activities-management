import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import { formatDatePickerDate, formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import TimeSlot from '../../../../enum/timeSlot'
import {
  convertToArray,
  getDatePresetOptionWithYesterday,
  getSelectedDate,
  PresetDateOptionsWithYesterday,
} from '../../../../utils/utils'

export class TimePeriod {
  @Expose()
  @IsIn(Object.values(PresetDateOptionsWithYesterday), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptionsWithYesterday.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date

  @Expose()
  @IsNotEmpty({ message: 'Select a time period' })
  sessions: TimeSlot[]
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { date, sessions } = req.query
    const datePresetOption = getDatePresetOptionWithYesterday(date as string)
    return res.render('pages/activities/record-attendance/select-period', {
      sessions,
      datePresetOption,
      date:
        date && datePresetOption === PresetDateOptionsWithYesterday.OTHER
          ? formatDatePickerDate(new Date(date as string))
          : null,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const selectedDate = getSelectedDate(req.body)
    const sessions = req.body.sessions ? convertToArray(req.body.sessions).join(',') : ''
    res.redirect(`activities?date=${formatIsoDate(selectedDate)}${sessions ? `&sessionFilters=${sessions}` : ''}`)
  }
}
