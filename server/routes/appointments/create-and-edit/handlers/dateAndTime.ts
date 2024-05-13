import { Request, Response } from 'express'
import { Expose, plainToInstance, Transform, Type } from 'class-transformer'
import { IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator'
import { startOfToday, subDays } from 'date-fns'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import TimeIsAfter from '../../../../validators/timeIsAfter'
import { hasAnyAppointmentPropertyChanged } from '../../../../utils/editAppointmentUtils'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import { formatDate } from '../../../../utils/utils'
import { YesNo } from '../../../../@types/activities'
import { AppointmentJourneyMode } from '../appointmentJourney'

const MAX_RETROSPECTIVE_DAYS = 6
export class DateAndTime {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date > subDays(startOfToday(), MAX_RETROSPECTIVE_DAYS), {
    message: `Enter a date that's after ${maximumRetrospectiveDate(new Date(), MAX_RETROSPECTIVE_DAYS)}`,
  })
  @IsValidDate({ message: 'Enter a valid date for the appointment' })
  @IsNotEmpty({ message: 'Enter a date for the appointment' })
  startDate: Date

  @Expose()
  @Type(() => SimpleTime)
  @ValidateIf(o => o.appointmentJourney.mode !== AppointmentJourneyMode.COPY)
  @ValidateNested()
  @IsNotEmpty({ message: 'Select a start time for the appointment' })
  startTime: SimpleTime

  @Expose()
  @Type(() => SimpleTime)
  @ValidateIf(o => o.appointmentJourney.mode !== AppointmentJourneyMode.COPY)
  @ValidateNested()
  @TimeIsAfter('startTime', { message: 'Select an end time after the start time' })
  @IsNotEmpty({ message: 'Select an end time for the appointment' })
  endTime: SimpleTime
}

export default class DateAndTimeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/date-and-time')
  }

  CREATE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentJourney } = req.session
    this.setTimeAndDate(req, 'appointmentJourney')
    const retrospective = retrospectiveAppointment(appointmentJourney.startTime)

    if (req.query.preserveHistory && !retrospective) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    if (retrospective) {
      appointmentJourney.retrospective = YesNo.YES
      appointmentJourney.repeat = YesNo.NO
      return res.redirectOrReturn('check-answers')
    }

    appointmentJourney.retrospective = YesNo.NO

    if (appointmentJourney.mode === AppointmentJourneyMode.COPY) {
      if (appointmentJourney.repeat === YesNo.YES) {
        return res.redirectOrReturn('copy-series')
      }
      return res.redirectOrReturn('schedule')
    }

    return res.redirectOrReturn('repeat')
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

    appointmentJourney.startDate = formatIsoDate(startDate)

    if (appointmentJourney.mode !== AppointmentJourneyMode.COPY) {
      appointmentJourney.startTime = {
        hour: startTime.hour,
        minute: startTime.minute,
      }

      appointmentJourney.endTime = {
        hour: endTime.hour,
        minute: endTime.minute,
      }
    }

    appointmentJourney.startTime.date = plainToInstance(SimpleTime, appointmentJourney.startTime).toDate(startDate)
    appointmentJourney.endTime.date = plainToInstance(SimpleTime, appointmentJourney.endTime).toDate(startDate)
  }
}

export function maximumRetrospectiveDate(fromDate: Date, daysAgo: number): string {
  const date = subDays(fromDate, daysAgo)
  return formatDate(date, 'd MMMM yyyy')
}

export function retrospectiveAppointment(startTime: { hour: number; minute: number; date: Date }) {
  const appointmentStart = new Date(startTime.date)
  appointmentStart.setHours(startTime.hour)
  appointmentStart.setMinutes(startTime.minute)

  return appointmentStart < new Date()
}
