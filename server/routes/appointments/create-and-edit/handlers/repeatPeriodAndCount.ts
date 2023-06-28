import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum, Min } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import MaxWhenDependentPropertyValueIs from '../../../../validators/maxWhenDependentPropertyValueIs'
import { AppointmentRepeatPeriod } from '../../../../@types/appointments'

export class RepeatPeriodAndCount {
  @Expose()
  @IsEnum(AppointmentRepeatPeriod, { message: 'Select how often the appointment will repeat' })
  repeatPeriod: AppointmentRepeatPeriod

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  @MaxWhenDependentPropertyValueIs(260, 'repeatPeriod', AppointmentRepeatPeriod.WEEKDAY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(365, 'repeatPeriod', AppointmentRepeatPeriod.DAILY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(52, 'repeatPeriod', AppointmentRepeatPeriod.WEEKLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @MaxWhenDependentPropertyValueIs(26, 'repeatPeriod', AppointmentRepeatPeriod.FORTNIGHTLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  @MaxWhenDependentPropertyValueIs(12, 'repeatPeriod', AppointmentRepeatPeriod.MONTHLY, {
    message: 'Number of appointments must be $constraint1 or fewer',
  })
  repeatCount: number
}

export default class RepeatPeriodAndCountRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/repeat-period-and-count')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { repeatPeriod, repeatCount } = req.body

    req.session.appointmentJourney.repeat = YesNo.YES
    req.session.appointmentJourney.repeatPeriod = repeatPeriod
    req.session.appointmentJourney.repeatCount = repeatCount

    res.redirectOrReturn(`schedule`)
  }
}
