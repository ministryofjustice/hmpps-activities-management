import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'
import IsValidDate from '../../../../validators/isValidDate'

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
  @IsIn(Object.values(PresetDateOptions), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @DateValidator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date

  @Expose()
  @IsIn(Object.values(ActivitySlotOptions), { message: 'Select a time' })
  activitySlot: string

  @Expose()
  @IsNotEmpty({ message: 'Select a location' })
  locationKey: string
}

export default class SelectDateAndLocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const locationGroups = await this.activitiesService.getLocationGroups(user)

    res.render('pages/activities/unlock-list/select-date-and-location', { locationGroups })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activitySlot, locationKey, datePresetOption, date } = req.body

    req.session.unlockListJourney = {
      timeSlot: activitySlot,
      locationKey,
    }

    const selectedDate = this.getDateValue(datePresetOption, date)
    return res.redirect(`planned-events?date=${formatIsoDate(selectedDate)}`)
  }

  private getDateValue = (datePresetOption: string, date: Date): Date => {
    if (datePresetOption === PresetDateOptions.TODAY) return new Date()
    if (datePresetOption === PresetDateOptions.TOMORROW) return addDays(new Date(), 1)
    return date
  }
}
