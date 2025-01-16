import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import { addDays, startOfToday, subDays } from 'date-fns'
import { getDatePresetOptionWithYesterday, getSelectedDate } from '../../../../utils/utils'
import { formatDatePickerDate, formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import DateOption from '../../../../enum/dateOption'

export class TimePeriod {
  @Expose()
  @IsIn(Object.values(DateOption), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === DateOption.OTHER)
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
    const datePresetOption = getDatePresetOptionWithYesterday(date as string)

    res.render('pages/activities/daily-attendance-summary/select-period', {
      title: 'What date do you want to see the daily attendance summary for?',
      datePresetOption,
      date: date && datePresetOption === DateOption.OTHER ? formatDatePickerDate(new Date(date as string)) : null,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.attendanceSummaryJourney = null

    const selectedDate = getSelectedDate(req.body)
    return res.redirect(`summary?date=${formatIsoDate(selectedDate)}`)
  }
}
