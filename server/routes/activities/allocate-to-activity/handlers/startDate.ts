import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { ValidateNested, ValidationArguments } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import DateIsAfter from '../../../../validators/dateIsAfter'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'
import { AllocateToActivityJourney } from '../journey'
import { formatDate } from '../../../../utils/utils'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfter(o => o.allocateJourney.activity.startDate, {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const activityStartDate = formatDate(new Date(allocateJourney.activity.startDate), 'd MMMM yyyy')
      return `Enter a date on or after the activity's scheduled start date, ${activityStartDate}`
    },
  })
  @DateIsSameOrBefore(o => o.allocateJourney.activity.endDate, {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const activityEndDate = formatDate(new Date(allocateJourney.activity.endDate), 'd MMMM yyyy')
      return `Enter a date on or before the activity's scheduled end date, ${activityEndDate}`
    },
  })
  @DateIsSameOrBefore(o => plainToInstance(SimpleDate, o.allocateJourney.endDate)?.toRichDate(), {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const allocationEndDate = formatDate(
        plainToInstance(SimpleDate, allocateJourney.endDate).toRichDate(),
        'd MMMM yyyy',
      )
      return `Enter a date on or before the allocation end date, ${allocationEndDate}`
    },
  })
  @DateIsAfter(new Date(), { message: "Enter a date after today's date" })
  @IsValidDate({
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const activityStartDate = formatDate(new Date(allocateJourney.activity.startDate), 'dd-MM-yyyy')
      return `Enter a date on or after the activity's scheduled start date, ${activityStartDate}`
    },
  })
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
