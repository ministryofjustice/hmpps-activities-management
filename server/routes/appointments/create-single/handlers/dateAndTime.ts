import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import IsValidDate from '../../../../validators/isValidDate'

export class DateAndTime {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a date for the appointment' })
  @IsValidDate({ message: 'Enter a date for the appointment' })
  startDate: SimpleDate

  @IsNotEmpty({ message: 'Enter a start time for the appointment' })
  startTime: SimpleTime

  @IsNotEmpty({ message: 'Enter an end time for the appointment' })
  endTime: SimpleTime
}

export default class DateAndTimeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-single/date-and-time')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createSingleAppointmentJourney.startDate = req.body.startDate
    req.session.createSingleAppointmentJourney.startTime = req.body.startTime
    req.session.createSingleAppointmentJourney.endTime = req.body.endTime
    res.redirect(`check-answers`)
  }
}
