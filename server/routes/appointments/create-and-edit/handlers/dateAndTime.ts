import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import IsValidDate from '../../../../validators/isValidDate'
import IsValidTime from '../../../../validators/isValidTime'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import TimeIsAfter from '../../../../validators/timeIsAfter'
import TimeAndDateIsAfterNow from '../../../../validators/timeAndDateIsAfterNow'
import { AppointmentJourneyMode } from '../appointmentJourney'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { getAppointmentBackLinkHref, isApplyToQuestionRequired } from '../../../../utils/editAppointmentUtils'

export class DateAndTime {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a date for the appointment' })
  @IsValidDate({ message: 'Enter a valid date for the appointment' })
  @DateIsSameOrAfter(new Date(), { message: "Enter a date on or after today's date" })
  startDate: SimpleDate

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
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/date-and-time', {
      backLinkHref: getAppointmentBackLinkHref(req, 'location'),
      isCtaAcceptAndSave:
        req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !isApplyToQuestionRequired(req.session.editAppointmentJourney),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    this.setTimeAndDate(req, 'appointmentJourney')

    res.redirectOrReturn(`repeat`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    this.setTimeAndDate(req, 'editAppointmentJourney')

    await this.editAppointmentService.redirectOrEdit(req, res, 'date-and-time')
  }

  private setTimeAndDate(req: Request, journeyName: string) {
    const appointmentJourney = req.session[journeyName]
    const { startDate, startTime, endTime } = req.body

    appointmentJourney.startDate = {
      day: startDate.day,
      month: startDate.month,
      year: startDate.year,
      date: startDate.toRichDate(),
    }

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
