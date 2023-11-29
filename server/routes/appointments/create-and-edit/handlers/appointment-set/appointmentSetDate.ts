import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty, MinDate } from 'class-validator'
import { startOfToday } from 'date-fns'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import IsValidDate from '../../../../../validators/isValidDate'

export class AppointmentSetDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @MinDate(() => startOfToday(), { message: "Enter a date on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date for the appointment' })
  @IsNotEmpty({ message: 'Enter a date for the appointment' })
  startDate: Date
}

export default class AppointmentSetDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/appointment-set/date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    req.session.appointmentJourney.startDate = formatIsoDate(req.body.startDate)

    res.redirectOrReturn(`appointment-set-times`)
  }
}
