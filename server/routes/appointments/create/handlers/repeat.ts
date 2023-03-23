import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'

export class Repeat {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes if the appointment will repeat' })
  repeat: YesNo
}

export default class RepeatRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create/repeat`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { repeat } = req.body

    const originalRepeat = req.session.createAppointmentJourney.repeat

    if (repeat === YesNo.NO || req.session.createAppointmentJourney.repeat === undefined) {
      req.session.createAppointmentJourney.repeat = repeat
    }

    if (repeat === YesNo.YES) {
      if (
        originalRepeat === YesNo.YES &&
        req.session.createAppointmentJourney.repeatPeriod !== undefined &&
        req.session.createAppointmentJourney.repeatCount !== undefined
      ) {
        res.redirect(`check-answers`)
      } else {
        res.redirect(`repeat-period-and-count`)
      }
    } else {
      res.redirect(`check-answers`)
    }
  }
}
