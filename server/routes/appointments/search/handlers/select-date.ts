import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { ValidationArguments } from 'class-validator'
import { datePickerDateToIsoDate } from '../../../../utils/datePickerUtils'
import IsValidDatePickerDate from '../../../../validators/isValidDatePickerDate'

export class SelectDate {
  @Expose()
  @IsValidDatePickerDate({
    message: (args: ValidationArguments) => {
      return args.value ? 'Enter a valid date' : 'Enter a date'
    },
  })
  startDate: string
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/appointments/search/select-date')

  POST = async (req: Request, res: Response) => {
    const { startDate } = req.body
    res.redirect(`/appointments/search?startDate=${datePickerDateToIsoDate(startDate)}`)
  }
}
