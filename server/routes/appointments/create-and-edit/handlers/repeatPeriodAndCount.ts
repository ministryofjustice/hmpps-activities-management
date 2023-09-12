import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum, Min } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import MaxWhenDependentPropertyValueIs from '../../../../validators/maxWhenDependentPropertyValueIs'
import { AppointmentFrequency } from '../../../../@types/appointments'

export class RepeatPeriodAndCount {
  @Expose()
  @IsEnum(AppointmentFrequency, { message: 'Select how often the appointment will repeat' })
  repeatPeriod: AppointmentFrequency

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  @MaxWhenDependentPropertyValueIs(260, 'repeatPeriod', AppointmentFrequency.WEEKDAY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(365, 'repeatPeriod', AppointmentFrequency.DAILY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(52, 'repeatPeriod', AppointmentFrequency.WEEKLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(26, 'repeatPeriod', AppointmentFrequency.FORTNIGHTLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  @MaxWhenDependentPropertyValueIs(12, 'repeatPeriod', AppointmentFrequency.MONTHLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  repeatCount: number
}

export default class RepeatPeriodAndCountRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/repeat-period-and-count')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const maxOccurrenceAllocations = 20000

    const { repeatPeriod, repeatCount } = req.body
    const prisonersCount = req.session.appointmentJourney.prisoners.length

    if (prisonersCount * repeatCount > maxOccurrenceAllocations) {
      return res.validationFailed(
        'repeatCount',
        `You cannot schedule more than ${Math.floor(
          maxOccurrenceAllocations / prisonersCount,
        )} appointments for this number of attendees.`,
      )
    }

    req.session.appointmentJourney.repeat = YesNo.YES
    req.session.appointmentJourney.frequency = repeatPeriod
    req.session.appointmentJourney.numberOfAppointments = repeatCount

    return res.redirectOrReturn(`schedule`)
  }
}
