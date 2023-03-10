import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsIn, Min } from 'class-validator'

enum RepeatPeriodOptions {
  Weekday = 'weekday',
  Daily = 'daily',
  Weekly = 'weekly',
  Fortnightly = 'fortnightly',
  Monthly = 'monthly',
}

export class RepeatPeriodAndCount {
  @Expose()
  @IsIn(Object.values(RepeatPeriodOptions), { message: 'Select how often the appointment will repeat' })
  repeatPeriod: RepeatPeriodOptions

  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Enter how many times the appointment will repeat up to a maximum of one year' })
  repeatCount: number
}

export default class QualificationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create-single/repeat-period-and-count`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { repeatPeriod, repeatCount } = req.body

    req.session.createSingleAppointmentJourney.repeat = 'yes'
    req.session.createSingleAppointmentJourney.repeatPeriod = repeatPeriod
    req.session.createSingleAppointmentJourney.repeatCount = repeatCount

    res.redirect(`check-answers`)
  }
}
