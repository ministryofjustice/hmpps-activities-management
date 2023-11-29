import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'

export class SelectDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsValidDate({ message: 'Enter a valid date' })
  @IsNotEmpty({ message: 'Enter a date' })
  startDate: Date
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/appointments/search/select-date')

  POST = async (req: Request, res: Response) => {
    const { startDate } = req.body
    res.redirect(`/appointments/search?startDate=${formatIsoDate(startDate)}`)
  }
}
