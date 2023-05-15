import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import DateIsAfter from '../../../validators/dateIsAfter'

export class DeallocationDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  @DateIsAfter(new Date(), { message: "Enter a date after today's date" })
  deallocationDate: SimpleDate
}

export default class DeallocationDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/deallocate-from-activity/deallocation-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationDate } = req.body
    req.session.deallocateJourney.deallocationDate = deallocationDate
    res.redirect('deallocate/reason')
  }
}
