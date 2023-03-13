import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

enum RepeatOption {
  YES = 'yes',
  NO = 'no',
}

export class Repeat {
  @Expose()
  @IsIn(Object.values(RepeatOption), { message: 'Select yes if the appointment will repeat' })
  repeat: RepeatOption
}

export default class RepeatRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/appointments/create-single/repeat`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { repeat } = req.body

    if (repeat === RepeatOption.NO || req.session.createSingleAppointmentJourney.repeat === undefined) {
      req.session.createSingleAppointmentJourney.repeat = repeat
    }

    if (repeat === RepeatOption.YES) {
      res.redirect(`repeat-period-and-count`)
    } else {
      res.redirect(`check-answers`)
    }
  }
}
