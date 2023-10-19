import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate, IsIn, ValidateIf } from 'class-validator'
import { startOfToday, subDays } from 'date-fns'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'

enum PresetDateOptions {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  OTHER = 'other',
}

export class TimePeriodForChanges {
  @Expose()
  @IsIn(Object.values(PresetDateOptions), { message: 'Select a date to query changes in the prison' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid date' })
  @DateValidator(date => date <= startOfToday(), { message: 'Enter a date on or before today' })
  date: Date
}

export default class SelectPeriodForChangesRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/change-of-circumstances/select-period')

  POST = async (req: Request, res: Response): Promise<void> => {
    const date = this.selectedDate(req.body)
    res.redirect(`view-changes?date=${formatIsoDate(date)}`)
  }

  private selectedDate(form: TimePeriodForChanges) {
    if (form.datePresetOption === PresetDateOptions.TODAY) return startOfToday()
    if (form.datePresetOption === PresetDateOptions.YESTERDAY) return subDays(startOfToday(), 1)
    return form.date
  }
}
