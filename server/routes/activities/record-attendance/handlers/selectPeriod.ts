import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, ValidateIf, ValidateNested } from 'class-validator'
import { addDays, format, subDays } from 'date-fns'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'

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
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  @DateIsSameOrBefore(() => addDays(new Date(), 60), { message: 'Enter a date up to 60 days in the future.' })
  date: SimpleDate
}

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/record-attendance/select-period')

  POST = async (req: Request, res: Response): Promise<void> => {
    let selectedDate: Date
    if (req.body.datePresetOption === PresetDateOptions.TODAY) {
      selectedDate = new Date()
    } else if (req.body.datePresetOption === PresetDateOptions.YESTERDAY) {
      selectedDate = subDays(new Date(), 1)
    } else {
      selectedDate = req.body.date.toRichDate()
    }

    res.redirect(`activities?date=${format(selectedDate, 'yyyy-MM-dd')}`)
  }
}
