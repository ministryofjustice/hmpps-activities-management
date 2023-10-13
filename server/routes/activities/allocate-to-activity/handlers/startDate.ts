import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate, ValidationArguments } from 'class-validator'
import { startOfToday } from 'date-fns'
import { AllocateToActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'

export class StartDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid start date' })
  @DateValidator(date => date > startOfToday(), { message: "Enter a date after today's date" })
  @DateValidator((date, { allocateJourney }) => date >= parseIsoDate(allocateJourney.activity.startDate), {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const activityStartDate = isoDateToDatePickerDate(allocateJourney.activity.startDate)
      return `Enter a date on or after the activity's start date, ${activityStartDate}`
    },
  })
  @DateValidator(
    (date, { allocateJourney }) => {
      return !allocateJourney.activity.endDate || date <= parseIsoDate(allocateJourney.activity.endDate)
    },
    {
      message: (args: ValidationArguments) => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const activityEndDate = isoDateToDatePickerDate(allocateJourney.activity.endDate)
        return `Enter a date on or before the activity's end date, ${activityEndDate}`
      },
    },
  )
  @DateValidator(
    (date, { allocateJourney }) => !allocateJourney.endDate || date <= parseIsoDate(allocateJourney.endDate),
    {
      message: (args: ValidationArguments) => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const allocationEndDate = isoDateToDatePickerDate(allocateJourney.endDate)
        return `Enter a date on or before the allocation end date, ${allocationEndDate}`
      },
    },
  )
  startDate: Date
}

export default class StartDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/allocate-to-activity/start-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.startDate = formatIsoDate(req.body.startDate)
    res.redirectOrReturn(`/activities/allocate/end-date-option`)
  }
}
