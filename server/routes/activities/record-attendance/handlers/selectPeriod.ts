import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate, IsIn, ValidateIf } from 'class-validator'
import { addDays, startOfToday, subDays } from 'date-fns'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'

enum PresetDateOptions {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  OTHER = 'other',
}

export class TimePeriod {
  @Expose()
  @IsIn(Object.values(PresetDateOptions), { message: 'Select an activity or appointment date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid date' })
  @DateValidator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  date: Date
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/record-attendance/select-period')

  POST = async (req: Request, res: Response): Promise<void> => {
    const selectedDate = this.selectedDate(req.body)
    res.redirect(`activities?date=${formatIsoDate(selectedDate)}`)
  }

  private selectedDate(form: TimePeriod) {
    if (form.datePresetOption === PresetDateOptions.TODAY) return new Date()
    if (form.datePresetOption === PresetDateOptions.YESTERDAY) return subDays(new Date(), 1)
    return form.date
  }
}
