import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate } from 'class-validator'
import { AllocateToActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'

export class EndDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid end date' })
  @DateValidator((date, { allocateJourney }) => date >= parseIsoDate(allocateJourney.startDate), {
    message: args => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const { startDate } = allocateJourney
      return `Enter a date on or after the allocation start date, ${isoDateToDatePickerDate(startDate)}`
    },
  })
  @DateValidator(
    (date, { allocateJourney }) => {
      return !allocateJourney?.activity?.endDate || date <= parseIsoDate(allocateJourney?.activity?.endDate)
    },
    {
      message: args => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const { endDate } = allocateJourney.activity
        return `Enter a date on or before the activity's end date, ${isoDateToDatePickerDate(endDate)}`
      },
    },
  )
  endDate: Date
}

export default class EndDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/allocate-to-activity/end-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.endDate = formatIsoDate(req.body.endDate)
    res.redirectOrReturn(`/activities/allocate/pay-band`)
  }
}
