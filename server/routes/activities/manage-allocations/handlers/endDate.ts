import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { startOfToday } from 'date-fns'
import { AllocateToActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'
import IsValidDate from '../../../../validators/isValidDate'

export class EndDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @DateValidator(date => date >= startOfToday(), { message: "Enter a date on or after today's date" })
  @DateValidator((date, { allocateJourney }) => date >= parseIsoDate(allocateJourney.latestAllocationStartDate), {
    message: args => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const { latestAllocationStartDate } = allocateJourney
      return `Enter a date on or after the allocation start date, ${isoDateToDatePickerDate(latestAllocationStartDate)}`
    },
  })
  @DateValidator(
    (date, { allocateJourney }) => {
      return date >= parseIsoDate(allocateJourney.activity.startDate)
    },
    {
      message: args => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const { startDate } = allocateJourney.activity
        return `Enter a date on or after the activity's start date, ${isoDateToDatePickerDate(startDate)}`
      },
    },
  )
  @DateValidator(
    (date, { allocateJourney }) => {
      return !allocateJourney.activity.endDate || date <= parseIsoDate(allocateJourney?.activity?.endDate)
    },
    {
      message: args => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const { endDate } = allocateJourney.activity
        return `Enter a date on or before the activity's end date, ${isoDateToDatePickerDate(endDate)}`
      },
    },
  )
  @IsValidDate({ message: 'Enter a valid end date' })
  endDate: Date
}

export default class EndDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/manage-allocations/end-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.endDate = formatIsoDate(req.body.endDate)
    if (req.params.mode === 'remove') {
      return res.redirectOrReturn(`reason`)
    }
    if (req.session.allocateJourney.activity.paid) {
      return res.redirectOrReturn('pay-band')
    }
    return res.redirectOrReturn('exclusions')
  }
}
