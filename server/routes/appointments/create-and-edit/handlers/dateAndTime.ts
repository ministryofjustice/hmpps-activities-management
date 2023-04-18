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
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/date-and-time')
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    this.setTimeAndDate(req)

    res.redirectOrReturn(`repeat`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId, occurrenceId } = req.params

    const { startDate, startTime, endTime } = req.session.appointmentJourney

    this.setTimeAndDate(req)

    const updatedStartDate = req.session.appointmentJourney.startDate
    const updatedStartTime = req.session.appointmentJourney.startTime
    const updatedEndTime = req.session.appointmentJourney.endTime

    await this.activitiesService.editAppointmentOccurrence(
      +occurrenceId,
      {
        startDate: plainToInstance(SimpleDate, updatedStartDate).toIsoString(),
        startTime: plainToInstance(SimpleTime, updatedStartTime).toIsoString(),
        endTime: plainToInstance(SimpleTime, updatedEndTime).toIsoString(),
        applyTo: EditApplyTo.THIS_OCCURRENCE,
      },
      user,
    )

    const updatedProperties = []
    if (startDate.date.toString() !== updatedStartDate.date.toISOString()) updatedProperties.push('date')
    if (startTime.hour !== updatedStartTime.hour || startTime.minute !== updatedStartTime.minute)
      updatedProperties.push('start time')
    if (endTime.hour !== updatedEndTime.hour || endTime.minute !== updatedEndTime.minute)
      updatedProperties.push('end time')

    if (updatedProperties.length > 0) {
      req.flash(
        'successMessage',
        JSON.stringify({
          message: `Appointment ${updatedProperties
            .join(', ')
            .replace(/(,)(?!.*\1)/, ' and')} for this occurrence changed successfully`,
        }),
      )
    }

    res.redirectOrReturn(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }

  private setTimeAndDate(req: Request) {
    const { startDate, startTime, endTime } = req.body

    req.session.appointmentJourney.startDate = {
      day: startDate.day,
      month: startDate.month,
      year: startDate.year,
      date: startDate.toRichDate(),
    }

    req.session.appointmentJourney.startTime = {
      hour: startTime.hour,
      minute: startTime.minute,
      date: startTime.toDate(req.session.appointmentJourney.startDate.date),
    }

    req.session.appointmentJourney.endTime = {
      hour: endTime.hour,
      minute: endTime.minute,
      date: endTime.toDate(req.session.appointmentJourney.startDate.date),
    }
  }
}
