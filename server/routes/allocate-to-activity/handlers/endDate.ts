import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import DateIsSameOrAfterOtherProperty from '../../../validators/dateIsSameOrAfterOtherProperty'
import { formatDate } from '../../../utils/utils'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid end date' })
  @IsValidDate({ message: 'Enter a valid end date' })
  @DateIsSameOrAfterOtherProperty('startDate', { message: 'Enter a date on or after the start date' })
  endDate: SimpleDate

  @Expose()
  startDate: string
}

export default class EndDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate
    const { activity } = req.session.allocateJourney

    const startDate = req.session.allocateJourney.startDate
      ? formatDate(plainToInstance(SimpleDate, req.session.allocateJourney.startDate).toRichDate(), 'yyyy-MM-dd')
      : undefined

    res.render(`pages/allocate-to-activity/end-date`, {
      startDate,
      prisonerName,
      activityName: activity.name,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.endDate = req.body.endDate

    if (req.query && req.query.fromReview) {
      res.redirect(`/allocate/check-answers`)
    } else {
      res.redirect(`/allocate/pay-band`)
    }
  }
}
