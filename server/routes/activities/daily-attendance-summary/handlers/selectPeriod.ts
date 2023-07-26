import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, ValidateIf, ValidateNested } from 'class-validator'
import { addDays, format, subDays } from 'date-fns'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'

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
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  @DateIsSameOrAfter(() => subDays(new Date(), 14), { message: 'Enter a date within the last 14 days' })
  @DateIsSameOrBefore(addDays(new Date(), 60), { message: 'Enter a date within the next 60 days' })
  date: SimpleDate
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/daily-attendance-summary/select-period', {
      title: 'What date do you want to see the daily attendance summary for?',
    })

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.datePresetOption === PresetDateOptions.TODAY) {
      return res.redirect(`summary?date=${this.formatDate(new Date())}`)
    }

    if (req.body.datePresetOption === PresetDateOptions.YESTERDAY) {
      return res.redirect(`summary?date=${this.formatDate(subDays(new Date(), 1))}`)
    }

    return res.redirect(`summary?date=${req.body.date.toString()}`)
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
