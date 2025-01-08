import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import { addDays, startOfToday, subDays } from 'date-fns'
import { formatDatePickerDate, formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'

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
  @Validator(thisDate => thisDate >= subDays(startOfToday(), 14), {
    message: 'Enter a date within the last 14 days',
  })
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { date } = req.query
    const datePresetOption = this.getDatePresetOption(date as string)

    res.render('pages/activities/daily-attendance-summary/select-period', {
      title: 'What date do you want to see the daily attendance summary for?',
      datePresetOption,
      date:
        date && datePresetOption === PresetDateOptions.OTHER ? formatDatePickerDate(new Date(date as string)) : null,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.attendanceSummaryJourney = null

    const selectedDate = this.selectedDate(req.body)
    return res.redirect(`summary?date=${formatIsoDate(selectedDate)}`)
  }

  private selectedDate(form: TimePeriod) {
    if (form.datePresetOption === PresetDateOptions.TODAY) return new Date()
    if (form.datePresetOption === PresetDateOptions.YESTERDAY) return subDays(new Date(), 1)
    return form.date
  }

  private getDatePresetOption = (date: string): PresetDateOptions => {
    if (date === undefined) return null
    if (date === this.getDate(new Date())) return PresetDateOptions.TODAY
    if (date === this.getDate(subDays(new Date(), 1))) return PresetDateOptions.YESTERDAY
    return PresetDateOptions.OTHER
  }

  private getDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }
}
