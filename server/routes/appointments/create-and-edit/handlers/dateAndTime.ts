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
    const { appointmentJourney } = req.session
    const { appointmentId, occurrenceId } = req.params

    res.render('pages/appointments/create-and-edit/date-and-time', {
      appointmentId,
      occurrenceId,
      isCtaAcceptAndSave:
        appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
        !this.editAppointmentUtils.isApplyToQuestionRequired(appointmentJourney),
    })
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    this.setTimeAndDate(req)

    res.redirectOrReturn(`repeat`)
  }

  EDIT = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentJourney } = req.session
    const { appointmentId, occurrenceId } = req.params

    const startDate = plainToInstance(SimpleDate, appointmentJourney.startDate)
    const startTime = plainToInstance(SimpleTime, appointmentJourney.startTime)
    const endTime = plainToInstance(SimpleTime, appointmentJourney.endTime)

    this.setTimeAndDate(req)

    const updatedStartDate = plainToInstance(SimpleDate, appointmentJourney.startDate)
    const updatedStartTime = plainToInstance(SimpleTime, appointmentJourney.startTime)
    const updatedEndTime = plainToInstance(SimpleTime, appointmentJourney.endTime)

    appointmentJourney.updatedProperties = []
    if (startDate.toIsoString() !== updatedStartDate.toIsoString()) appointmentJourney.updatedProperties.push('date')
    if (startTime.toIsoString() !== updatedStartTime.toIsoString())
      appointmentJourney.updatedProperties.push('start time')
    if (endTime.toIsoString() !== updatedEndTime.toIsoString()) appointmentJourney.updatedProperties.push('end time')

    if (appointmentJourney.updatedProperties.length === 0) {
      res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
    } else {
      await this.editAppointmentUtils.redirectOrEdit(
        +appointmentId,
        +occurrenceId,
        appointmentJourney,
        'date-and-time',
        user,
        res,
      )
    }
  }

  private setTimeAndDate(req: Request) {
    const { appointmentJourney } = req.session
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
