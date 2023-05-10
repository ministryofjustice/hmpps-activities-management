import { Request, Response } from 'express'
import { Expose, Type, plainToInstance } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import IsValidDate from '../../../../validators/isValidDate'
import IsValidTime from '../../../../validators/isValidTime'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import TimeIsAfter from '../../../../validators/timeIsAfter'
import TimeAndDateIsAfterNow from '../../../../validators/timeAndDateIsAfterNow'
import ActivitiesService from '../../../../services/activitiesService'
import { EditApplyTo } from '../../../../@types/appointments'
import { AppointmentJourneyMode } from '../appointmentJourney'
import EditAppointmentUtils from '../../../../utils/helpers/editAppointmentUtils'

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
  @IsNotEmpty({ message: 'Select a start time for the appointment' })
  @IsValidTime({ message: 'Select a valid start time for the appointment' })
  @TimeAndDateIsAfterNow('startDate', { message: 'Select a start time that is in the future' })
  startTime: SimpleTime

  @Expose()
  @Type(() => SimpleTime)
  @ValidateNested()
  @IsNotEmpty({ message: 'Select an end time for the appointment' })
  @IsValidTime({ message: 'Select a valid end time for the appointment' })
  @TimeIsAfter('startTime', { message: 'Select an end time after the start time' })
  endTime: SimpleTime
}

export default class DateAndTimeRoutes {
  private readonly editAppointmentUtils: EditAppointmentUtils

  constructor(private readonly activitiesService: ActivitiesService) {
    this.editAppointmentUtils = new EditAppointmentUtils(activitiesService)
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/date-and-time', {
      backLinkHref: this.editAppointmentUtils.getBackLinkHref(req, 'name'),
      isCtaAcceptAndSave: !this.editAppointmentUtils.isApplyToQuestionRequired(req),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    this.setTimeAndDate(req, 'appointmentJourney')

    res.redirectOrReturn(`repeat`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    this.setTimeAndDate(req, 'editAppointmentJourney')

    await this.editAppointmentUtils.redirectOrEdit(req, res, 'date-and-time')
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
