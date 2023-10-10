import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { ValidationArguments } from 'class-validator'
import IsValidDatePickerDate from '../../../../../validators/isValidDatePickerDate'
import DatePickerDateIsSameOrAfter from '../../../../../validators/datePickerDateIsSameOrAfter'
import { datePickerDateToIsoDate } from '../../../../../utils/datePickerUtils'

export class AppointmentSetDate {
  @Expose()
  @IsValidDatePickerDate({
    message: (args: ValidationArguments) => {
      return args.value ? 'Enter a valid date for the appointment' : 'Enter a date for the appointment'
    },
  })
  @DatePickerDateIsSameOrAfter(() => new Date(), { message: "Enter a date on or after today's date" })
  startDate: string
}

export default class AppointmentSetDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/appointment-set/date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    req.session.appointmentJourney.startDate = datePickerDateToIsoDate(req.body.startDate)

    res.redirectOrReturn(`appointment-set-times`)
  }
}
