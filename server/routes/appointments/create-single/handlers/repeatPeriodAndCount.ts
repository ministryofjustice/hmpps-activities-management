import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum, Min } from 'class-validator'
import { AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'

export class RepeatPeriodAndCount {
  @Expose()
  @IsEnum(AppointmentRepeatPeriod, { message: 'Select how often the appointment will repeat' })
  repeatPeriod: AppointmentRepeatPeriod

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

    req.session.createSingleAppointmentJourney.repeat = YesNo.YES
    req.session.createSingleAppointmentJourney.repeatPeriod = repeatPeriod
    req.session.createSingleAppointmentJourney.repeatCount = repeatCount

    res.redirect(`check-answers`)
  }
}
