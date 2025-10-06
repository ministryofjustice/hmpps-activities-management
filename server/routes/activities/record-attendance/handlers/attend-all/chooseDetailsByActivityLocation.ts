import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import _ from 'lodash'
import ActivitiesService from '../../../../../services/activitiesService'
import DateOption from '../../../../../enum/dateOption'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import Validator from '../../../../../validators/validator'
import IsValidDate from '../../../../../validators/isValidDate'
import TimeSlot from '../../../../../enum/timeSlot'
import { getSelectedDate } from '../../../../../utils/utils'
import LocationsService from '../../../../../services/locationsService'
import LocationType from '../../../../../enum/locationType'

export class ChooseDetailsByActivityLocationForm {
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
  timePeriod: TimeSlot[]

  @Expose()
  @IsNotEmpty({ message: 'Search for a specific location, or select a location option' })
  locationType: string

  @Expose()
  @ValidateIf(o => o.locationType === LocationType.OUT_OF_CELL)
  @IsNotEmpty({ message: 'Enter a location and select it from the list' })
  location: string
}

export default class ChooseDetailsByActivityLocationRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly locationsService: LocationsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const locations = await this.locationsService.fetchNonResidentialActivityLocations(user.activeCaseLoadId, user)
    const uniqueLocations = _.uniqBy(locations, 'id').filter(l => l.locationType !== 'BOX')

    res.render('pages/activities/record-attendance/attend-all/choose-details-by-activity-location', {
      locations: uniqueLocations,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { timePeriod, location, locationType } = req.body
    const selectedDate = getSelectedDate(req.body)

    let locationId: string
    if (location && location !== '-') {
      locationId = location
    } else {
      locationId = ''
    }

    const redirectUrl =
      `list-activities?date=${formatIsoDate(selectedDate)}` +
      `&sessionFilters=${timePeriod}` +
      `&locationId=${locationId}` +
      `&locationType=${locationType ?? ''}`

    return res.redirect(redirectUrl)
  }
}
