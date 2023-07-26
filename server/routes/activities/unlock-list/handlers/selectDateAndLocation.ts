import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator'
import { format, addDays } from 'date-fns'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import ActivitiesService from '../../../../services/activitiesService'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'

enum PresetDateOptions {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
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
  @DateIsSameOrBefore(addDays(new Date(), 60), { message: 'Enter a date up to 60 days in the future' })
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

    const locationGroups = await this.activitiesService.getLocationGroups(user)
    req.session.unlockListJourney ??= {}

    res.render('pages/activities/unlock-list/select-date-and-location', { locationGroups })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activitySlot, location, datePresetOption, date } = req.body

    req.session.unlockListJourney.timeSlot = activitySlot
    req.session.unlockListJourney.location = location

    const selectedDate = this.getDateValue(datePresetOption, date)
    return res.redirect(`planned-events?date=${selectedDate}`)
  }

  private getDateValue = (datePresetOption: string, date: SimpleDate): string => {
    if (datePresetOption === PresetDateOptions.TODAY) {
      return this.formatDate(new Date())
    }
    if (datePresetOption === PresetDateOptions.TOMORROW) {
      return this.formatDate(addDays(new Date(), 1)).toString()
    }
    // Use the POSTed date, which is a SimpleDate.
    return this.formatDate(date.toRichDate())
  }

  private formatDate = (date: Date) => format(date, 'yyyy-MM-dd')
}
