import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, MaxLength } from 'class-validator'

export class Name {
  @Expose()
  @IsNotEmpty({ message: 'Enter a name for the schedule' })
  @MaxLength(40, { message: 'Enter a name for the schedule that is 40 characters or less' })
  name: string
}

export default class NameRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/manage-schedules/create-schedule/name')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createScheduleJourney.name = req.body.name
    res.redirectOrReturn(`start-date`)
  }
}
