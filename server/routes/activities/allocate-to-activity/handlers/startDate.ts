import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import DateIsAfter from '../../../../validators/dateIsAfter'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfter(o => o.allocateJourney.activity.startDate, {
    message: 'Enter a date on or after the activity start date',
  })
  @DateIsAfter(new Date(), { message: "Enter a date after today's date" })
  @IsValidDate({ message: 'Enter a valid start date' })
  startDate: SimpleDate
}

export default class StartDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate

    res.render(`pages/activities/allocate-to-activity/start-date`, {
      prisonerName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.startDate = req.body.startDate

    if (req.query && req.query.preserveHistory) {
      res.redirect(`/activities/allocate/check-answers`)
    } else {
      res.redirect(`/activities/allocate/end-date-option`)
    }
  }
}
