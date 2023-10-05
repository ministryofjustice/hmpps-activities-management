import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested, ValidationArguments } from 'class-validator'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import IsValidTime from '../../../../validators/isValidTime'
import TimeIsAfter from '../../../../validators/timeIsAfter'
import TimeAndDateIsAfterNow from '../../../../validators/timeAndDateIsAfterNow'
import { hasAnyAppointmentPropertyChanged } from '../../../../utils/editAppointmentUtils'
import IsValidDatePickerDate from '../../../../validators/isValidDatePickerDate'
import DatePickerDateIsSameOrAfter from '../../../../validators/datePickerDateIsSameOrAfter'
import { datePickerDateToIsoDate } from '../../../../utils/datePickerUtils'

export class DateAndTime {
  @Expose()
  @IsValidDatePickerDate({
    message: (args: ValidationArguments) => {
      return args.value ? 'Enter a valid date for the appointment' : 'Enter a date for the appointment'
    },
  })
  @DatePickerDateIsSameOrAfter(() => new Date(), { message: "Enter a date on or after today's date" })
  startDate: string

  @Expose()
  @Type(() => SimpleTime)
  @ValidateNested()
  @TimeAndDateIsAfterNow('startDate', { message: 'Select a start time that is in the future' })
  @IsNotEmpty({ message: 'Select a start time for the appointment' })
  @IsValidTime({ message: 'Select a valid start time for the appointment' })
  startTime: SimpleTime

  @Expose()
  @Type(() => SimpleTime)
  @ValidateNested()
  @TimeIsAfter('startTime', { message: 'Select an end time after the start time' })
  @IsNotEmpty({ message: 'Select an end time for the appointment' })
  @IsValidTime({ message: 'Select a valid end time for the appointment' })
  endTime: SimpleTime
}

export default class DateAndTimeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/date-and-time')
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    this.setTimeAndDate(req, 'appointmentJourney')

    res.redirectOrReturn(`repeat`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params

    this.setTimeAndDate(req, 'editAppointmentJourney')

    if (hasAnyAppointmentPropertyChanged(req.session.appointmentJourney, req.session.editAppointmentJourney)) {
      return res.redirect('schedule')
    }

    req.session.appointmentJourney = null
    req.session.editAppointmentJourney = null

    return res.redirect(`/appointments/${appointmentId}`)
  }

  private setTimeAndDate(req: Request, journeyName: string) {
    const appointmentJourney = req.session[journeyName]
    const { startDate, startTime, endTime } = req.body

    appointmentJourney.startDate = datePickerDateToIsoDate(startDate)

    appointmentJourney.startTime = {
      hour: startTime.hour,
      minute: startTime.minute,
      date: startTime.toDate(appointmentJourney.startDate.date),
    }

    appointmentJourney.endTime = {
      hour: endTime.hour,
      minute: endTime.minute,
      date: endTime.toDate(appointmentJourney.startDate.date),
    }
  }
}
