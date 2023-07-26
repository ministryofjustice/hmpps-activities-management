import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import { formatDate } from '../../../../utils/utils'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfter(o => o.allocateJourney.activity.startDate, {
    message: 'Enter a date on or after the activity start date',
  })
  // @DateIsAfter(new Date(), { message: "Enter a date after today's date" })
  @IsValidDate({ message: 'Enter a valid start date' })
  startDate: SimpleDate
}

export default class StartDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate

    const activityStartDate = req.session.allocateJourney.activity.startDate
      ? formatDate(
          plainToInstance(SimpleDate, req.session.allocateJourney.activity.startDate).toRichDate(),
          'yyyy-MM-dd',
        )
      : undefined

    res.render(`pages/activities/allocate-to-activity/start-date`, {
      activityStartDate,
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
