import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { formatDatePickerDate, formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import { getDatePresetOptionWithTomorrow, PresetDateOptionsWithTomorrow } from '../../../../utils/utils'
import TimeSlot from '../../../../enum/timeSlot'

export class DateAndLocation {
  @Expose()
  @IsIn(Object.values(PresetDateOptionsWithTomorrow), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptionsWithTomorrow.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date

  @Expose()
  @IsIn(Object.values(TimeSlot), { message: 'Select a time' })
  activitySlot: string

  @Expose()
  @IsNotEmpty({ message: 'Select a location' })
  locationKey: string
}

export default class SelectDateAndLocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, locationKey, activitySlot } = req.query

    const datePresetOption = getDatePresetOptionWithTomorrow(date as string)
    const locationGroups = await this.activitiesService.getLocationGroups(user)

    res.render('pages/activities/unlock-list/select-date-and-location', {
      locationGroups,
      datePresetOption,
      date:
        date && datePresetOption === PresetDateOptionsWithTomorrow.OTHER
          ? formatDatePickerDate(new Date(date as string))
          : null,
      locationKey: locationKey || null,
      activitySlot: activitySlot || null,
    })
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
    if (datePresetOption === PresetDateOptionsWithTomorrow.TODAY) return new Date()
    if (datePresetOption === PresetDateOptionsWithTomorrow.TOMORROW) return addDays(new Date(), 1)
    return date
  }
}
