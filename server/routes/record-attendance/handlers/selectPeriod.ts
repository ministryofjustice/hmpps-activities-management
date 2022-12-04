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

enum ActivitySlotOptions {
  AM = 'am',
  PM = 'pm',
  ED = 'ed',
}

export class TimePeriod {
  @Expose()
  @IsIn(Object.values(PresetDateOptions), { message: 'Select an activity or appointment date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  date: SimpleDate

  @Expose()
  @IsIn(Object.values(ActivitySlotOptions), { message: 'Select a time period' })
  activitySlot: string
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> => res.render('pages/record-attendance/select-period')

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.datePresetOption === PresetDateOptions.TODAY) {
      return res.redirect(`activities?date=${this.formatDate(new Date())}&slot=${req.body.activitySlot}`)
    }

    if (req.body.datePresetOption === PresetDateOptions.YESTERDAY) {
      return res.redirect(`activities?date=${this.formatDate(subDays(new Date(), 1))}&slot=${req.body.activitySlot}`)
    }

    return res.redirect(`activities?date=${req.body.date.toString()}&slot=${req.body.activitySlot}`)
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
