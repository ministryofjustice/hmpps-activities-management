import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator'
import { format, subDays } from 'date-fns'
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
  @IsNotEmpty({ message: 'Select a location' })
  location: string
}

export default class SelectDateAndLocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    if (req.session?.unlockFilters) {
      delete req.session.unlockFilters
    }
    // Uses the user's activeCaseLoadId to get the prison location groups
    const locationGroups = await this.activitiesService.getLocationGroups(user)
    res.render('pages/unlock-list/select-date-and-location', { locationGroups })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const selectedDate = this.getDateValue(req.body)
    return res.redirect(
      `planned-events?date=${selectedDate}&slot=${req.body.activitySlot}&location=${req.body.location}`,
    )
  }

  private getDateValue = (body: DateAndLocation): string => {
    if (body.datePresetOption === PresetDateOptions.TODAY) {
      return this.formatDate(new Date())
    }
    if (body.datePresetOption === PresetDateOptions.YESTERDAY) {
      return this.formatDate(subDays(new Date(), 1)).toString()
    }
    // Use the POSTed date, which is a SimpleDate.
    return this.formatDate(body.date.toRichDate())
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
