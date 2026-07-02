import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import { format, startOfToday, subDays } from 'date-fns'
import { formatDatePickerDate, formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import Validator from '../../../../validators/validator'
import DateOption from '../../../../enum/dateOption'
import IsValidDate from '../../../../validators/isValidDate'

export class TimePeriodForChanges {
  @Expose()
  @IsIn(Object.values(DateOption), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === DateOption.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date <= startOfToday(), { message: 'Enter a date on or before today' })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date
}

export default class SelectPeriodForChangesRoutes {
  GET = async (req: Request, res: Response) =>
    res.render('pages/activities/change-of-circumstances/select-period', this.viewModel())

  POST = async (req: Request, res: Response): Promise<void> => {
    const date = this.selectedDate(req.body)
    res.redirect(`view-changes?date=${formatIsoDate(date)}`)
  }

  private selectedDate(form: TimePeriodForChanges) {
    if (form.datePresetOption === DateOption.TODAY) return startOfToday()
    if (form.datePresetOption === DateOption.YESTERDAY) return subDays(startOfToday(), 1)
    return form.date
  }

  private viewModel() {
    const today = startOfToday()
    const yesterday = subDays(today, 1)

    return {
      todayOptionText: `Today - ${format(today, 'EEEE, dd MMMM yyyy')}`,
      yesterdayOptionText: `Yesterday - ${format(yesterday, 'EEEE, dd MMMM yyyy')}`,
      maxDate: formatDatePickerDate(today),
    }
  }
}
