import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, ValidateIf, ValidateNested } from 'class-validator'
import { format, subDays } from 'date-fns'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import DateIsSameOrBefore from '../../../validators/dateIsSameOrBefore'

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
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  @DateIsSameOrBefore(new Date(), { message: 'Enter a date on or before today' })
  date: SimpleDate
}

export default class SelectPeriodForChangesRoutes {
  GET = async (req: Request, res: Response): Promise<void> => res.render('pages/change-of-circumstances/select-period')

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.datePresetOption === PresetDateOptions.TODAY) {
      return res.redirect(`view-changes?date=${this.formatDate(new Date())}`)
    }

    if (req.body.datePresetOption === PresetDateOptions.YESTERDAY) {
      return res.redirect(`view-changes?date=${this.formatDate(subDays(new Date(), 1))}`)
    }

    return res.redirect(`view-changes?date=${req.body.date.toIsoString()}`)
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
