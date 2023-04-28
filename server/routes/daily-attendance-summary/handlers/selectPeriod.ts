import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, ValidateIf, ValidateNested } from 'class-validator'
import { format, subDays } from 'date-fns'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'

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
  date: SimpleDate
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> => res.render('pages/daily-attendance-summary/select-period')

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
