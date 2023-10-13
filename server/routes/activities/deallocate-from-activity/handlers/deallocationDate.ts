import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate } from 'class-validator'
import { startOfToday } from 'date-fns'
import { DeallocateFromActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'

export class DeallocationDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid end date' })
  @DateValidator(date => date > startOfToday(), { message: "Enter a date after today's date" })
  @DateValidator((date, { deallocateJourney }) => date >= parseIsoDate(deallocateJourney.latestAllocationStartDate), {
    message: ({ object }) => {
      const { deallocateJourney } = object as { deallocateJourney: DeallocateFromActivityJourney }
      const allocationStartDate = isoDateToDatePickerDate(deallocateJourney.latestAllocationStartDate)
      return `Enter a date on or after the allocation start date, ${allocationStartDate}`
    },
  })
  @DateValidator(
    (date, { deallocateJourney }) => {
      return !deallocateJourney.activity?.endDate || date <= parseIsoDate(deallocateJourney.activity.endDate)
    },
    {
      message: ({ object }) => {
        const { deallocateJourney } = object as { deallocateJourney: DeallocateFromActivityJourney }
        const activityEndDate = isoDateToDatePickerDate(deallocateJourney.activity.endDate)
        return `Enter a date on or before the activity's scheduled end date, ${activityEndDate}`
      },
    },
  )
  deallocationDate: Date
}

export default class DeallocationDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/deallocate-from-activity/deallocation-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationDate } = req.body
    req.session.deallocateJourney.deallocationDate = formatIsoDate(deallocationDate)
    res.redirectOrReturn('reason')
  }
}
