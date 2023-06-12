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
    res.render('pages/appointments/create-and-edit/repeat')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { repeat } = req.body

    const originalRepeat = req.session.appointmentJourney.repeat

    if (repeat === YesNo.NO || originalRepeat === undefined) {
      req.session.appointmentJourney.repeat = repeat
    }

    if (repeat === YesNo.YES) {
      if (
        originalRepeat === YesNo.YES &&
        req.session.appointmentJourney.repeatPeriod !== undefined &&
        req.session.appointmentJourney.repeatCount !== undefined
      ) {
        res.redirectOrReturn(`comment`)
      } else {
        res.redirect(`repeat-period-and-count${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
      }
    } else {
      res.redirectOrReturn(`comment`)
    }
  }
}
