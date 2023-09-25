import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum, Min } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import MaxWhenDependentPropertyValueIs from '../../../../validators/maxWhenDependentPropertyValueIs'
import { AppointmentFrequency } from '../../../../@types/appointments'
import config from '../../../../config'

export class RepeatFrequencyAndCount {
  @Expose()
  @IsEnum(AppointmentFrequency, { message: 'Select how often the appointment will repeat' })
  frequency: AppointmentFrequency

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  @MaxWhenDependentPropertyValueIs(260, 'frequency', AppointmentFrequency.WEEKDAY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(365, 'frequency', AppointmentFrequency.DAILY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(52, 'frequency', AppointmentFrequency.WEEKLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(26, 'frequency', AppointmentFrequency.FORTNIGHTLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  @MaxWhenDependentPropertyValueIs(12, 'frequency', AppointmentFrequency.MONTHLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  numberOfAppointments: number
}

export default class RepeatFrequencyAndCountRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/repeat-frequency-and-count')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { frequency, numberOfAppointments } = req.body
    const prisonersCount = req.session.appointmentJourney.prisoners.length
    const { maxAppointmentInstances } = config.appointmentsConfig

    if (prisonersCount * numberOfAppointments > maxAppointmentInstances) {
      return res.validationFailed(
        'numberOfAppointments',
        `You cannot schedule more than ${Math.floor(
          maxAppointmentInstances / prisonersCount,
        )} appointments for this number of attendees.`,
      )
    }

    req.session.appointmentJourney.repeat = YesNo.YES
    req.session.appointmentJourney.frequency = frequency
    req.session.appointmentJourney.numberOfAppointments = numberOfAppointments

    return res.redirectOrReturn(`schedule`)
  }
}
