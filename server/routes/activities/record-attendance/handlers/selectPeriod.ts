import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { addDays, startOfToday, subDays } from 'date-fns'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import TimeSlot from '../../../../enum/timeSlot'
import config from '../../../../config'
import { convertToArray } from '../../../../utils/utils'

enum PresetDateOptions {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  OTHER = 'other',
}

export class TimePeriod {
  @Expose()
  @IsIn(Object.values(PresetDateOptions), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date

  @Expose()
  @ValidateIf(_ => config.recordAttendanceSelectSlotFirst)
  @IsNotEmpty({ message: 'Select a time period' })
  sessions: TimeSlot[]
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/activities/record-attendance/select-period')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const selectedDate = this.selectedDate(req.body)
    const sessions = req.body.sessions ? convertToArray(req.body.sessions).join(',') : ''
    res.redirect(`activities?date=${formatIsoDate(selectedDate)}${sessions ? `&sessionFilters=${sessions}` : ''}`)
  }

  private selectedDate(form: TimePeriod) {
    if (form.datePresetOption === PresetDateOptions.TODAY) return new Date()
    if (form.datePresetOption === PresetDateOptions.YESTERDAY) return subDays(new Date(), 1)
    return form.date
  }
}
