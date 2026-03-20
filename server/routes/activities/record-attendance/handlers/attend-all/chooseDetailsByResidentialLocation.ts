import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import DateOption from '../../../../../enum/dateOption'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import Validator from '../../../../../validators/validator'
import IsValidDate from '../../../../../validators/isValidDate'
import TimeSlot from '../../../../../enum/timeSlot'
import { getSelectedDate } from '../../../../../utils/utils'
import ActivitiesService from '../../../../../services/activitiesService'

export class ChooseDetailsByResidentialLocationForm {
  @Expose()
  @IsIn(Object.values(DateOption), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === DateOption.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date

  @Expose()
  @IsNotEmpty({ message: 'Select a time period' })
  timePeriod: TimeSlot

  @Expose()
  @IsNotEmpty({ message: 'Select a residential location' })
  locationKey: string
}

export default class ChooseDetailsByResidentialLocationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locationGroups = await this.activitiesService.getLocationGroups(user)

    if (req.journeyData.recordAttendanceJourney) {
      req.journeyData.recordAttendanceJourney.searchTerm = undefined
      req.journeyData.recordAttendanceJourney.subLocationFilters = undefined
    }

    res.render('pages/activities/record-attendance/attend-all/choose-details-by-residential-location', {
      locationGroups,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { timePeriod, locationKey } = req.body
    const selectedDate = getSelectedDate(req.body)

    const redirectUrl = `select-people-by-residential-location?date=${formatIsoDate(selectedDate)}&sessionFilters=${timePeriod}&locationKey=${locationKey}`
    return res.redirect(redirectUrl)
  }
}
