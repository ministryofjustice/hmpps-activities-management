import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'

export class SelectDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsValidDate({ message: 'Enter a valid date' })
  startDate: SimpleDate
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/appointments/search/select-date')

  POST = async (req: Request, res: Response) => {
    const { startDate }: { startDate: SimpleDate } = req.body
    res.redirect(`/appointments/search?startDate=${startDate.toIsoString()}`)
  }
}
