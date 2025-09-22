import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import { ActivitySummary } from '../../../../../@types/activitiesAPI/types'
import DateOption from '../../../../../enum/dateOption'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import Validator from '../../../../../validators/validator'
import IsValidDate from '../../../../../validators/isValidDate'
import TimeSlot from '../../../../../enum/timeSlot'
import { getSelectedDate } from '../../../../../utils/utils'

export class ChooseDetailsToRecordAttendanceForm {
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
  @IsNotEmpty({ message: 'Enter an activity name and select it from the list' })
  activityId: string
}

export default class ChooseDetailsToRecordAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activities: ActivitySummary[] = await this.activitiesService.getActivities(true, user)

    res.render('pages/activities/record-attendance/attend-all/choose-details-to-record-attendance', {
      activities,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { timePeriod, activityId } = req.body
    const selectedDate = getSelectedDate(req.body)
    return res.redirect(
      `select-people-to-record-attendance-for?date=${formatIsoDate(selectedDate)}&timePeriods=${timePeriod}&activityId=${activityId}`,
    )
  }
}
