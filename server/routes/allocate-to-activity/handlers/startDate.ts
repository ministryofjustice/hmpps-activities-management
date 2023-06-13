import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import DateIsAfter from '../../../validators/dateIsAfter'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid start date' })
  @IsValidDate({ message: 'Enter a valid start date' })
  @DateIsAfter(new Date(), { message: "Enter a date after today's date" })
  startDate: SimpleDate
}

export default class StartDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate

    res.render(`pages/allocate-to-activity/start-date`, {
      prisonerName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.startDate = req.body.startDate

    if (req.query && req.query.fromReview) {
      res.redirect(`/allocate/check-answers`)
    } else {
      res.redirect(`/allocate/end-date-option`)
    }
  }
}
