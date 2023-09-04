import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested, ValidationArguments } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import { formatDate } from '../../../../utils/utils'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'
import { DeallocateFromActivityJourney } from '../journey'

export class DeallocationDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfter(o => new Date(o.deallocateJourney.latestAllocationStartDate), {
    message: (args: ValidationArguments) => {
      const { deallocateJourney } = args.object as { deallocateJourney: DeallocateFromActivityJourney }
      const allocationStartDate = formatDate(new Date(deallocateJourney.latestAllocationStartDate), 'dd-MM-yyyy')
      return `Enter a date on or after the allocation start date, ${allocationStartDate}`
    },
  })
  @DateIsSameOrBefore(
    o => (o.deallocateJourney.activity.endDate ? new Date(o.deallocateJourney.activity.endDate) : null),
    {
      message: (args: ValidationArguments) => {
        const { deallocateJourney } = args.object as { deallocateJourney: DeallocateFromActivityJourney }
        return `Enter a date on or before the activity's scheduled end date, ${deallocateJourney.activity.endDate}`
      },
    },
  )
  @IsValidDate({ message: 'Enter a valid end date' })
  deallocationDate: SimpleDate

  @Expose()
  startDate: string
}

export default class DeallocationDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/deallocate-from-activity/deallocation-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationDate } = req.body
    req.session.deallocateJourney.deallocationDate = deallocationDate
    res.redirectOrReturn('reason')
  }
}
