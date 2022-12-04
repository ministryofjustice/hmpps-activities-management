import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator'
import { format, subDays } from 'date-fns'
import logger from '../../../../logger'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import ActivitiesService from '../../../services/activitiesService'

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

export class DateAndLocation {
  @Expose()
  @IsIn(Object.values(PresetDateOptions), { message: 'Select a date for the unlock list' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  date: SimpleDate

  @Expose()
  @IsIn(Object.values(ActivitySlotOptions), { message: 'Select a time slot' })
  activitySlot: string

  @Expose()
  @IsNotEmpty({ message: 'Select one or more locations' })
  location: string
}

export default class SelectDateAndLocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    logger.info(`User information - ${JSON.stringify(user)}`)
    res.render('pages/unlock-list/select-date-and-location')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.datePresetOption === PresetDateOptions.TODAY) {
      return res.redirect(
        `unlock-list` +
          `?date=${this.formatDate(new Date())}` +
          `&slot=${req.body.activitySlot}` +
          `&location=${req.body.location}`,
      )
    }

    if (req.body.datePresetOption === PresetDateOptions.YESTERDAY) {
      return res.redirect(
        `unlock-list` +
          `?date=${this.formatDate(subDays(new Date(), 1))}` +
          `&slot=${req.body.activitySlot}` +
          `&location=${req.body.location}`,
      )
    }

    return res.redirect(
      `unlock-list` +
        `?date=${req.body.date.toString()}` +
        `&slot=${req.body.activitySlot}` +
        `&location=${req.body.location}`,
    )
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
