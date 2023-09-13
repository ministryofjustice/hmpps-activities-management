import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../../validators/dateIsSameOrAfter'

export class AppointmentSetDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfter(() => new Date(), { message: "Enter a date on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date for the appointment' })
  @IsNotEmpty({ message: 'Enter a date for the appointment' })
  startDate: SimpleDate
}

export default class AppointmentSetDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/appointment-set/date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    const { startDate } = req.body

    req.session.appointmentJourney.startDate = {
      day: startDate.day,
      month: startDate.month,
      year: startDate.year,
      date: startDate.toRichDate(),
    }

    res.redirectOrReturn(`appointment-set-times`)
  }
}
