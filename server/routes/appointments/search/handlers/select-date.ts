import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { datePickerDateToIso } from '../../../../utils/datePickerUtils'
import IsValidDatePickerDate from '../../../../validators/isValidDatePickerDate'

export class SelectDate {
  @Expose()
  @IsNotEmpty({ message: 'Enter a date' })
  @IsValidDatePickerDate({ message: 'Enter a valid date' })
  startDate: string
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/appointments/search/select-date')

  POST = async (req: Request, res: Response) => {
    const { startDate } = req.body
    res.redirect(`/appointments/search?startDate=${datePickerDateToIso(startDate)}`)
  }
}
