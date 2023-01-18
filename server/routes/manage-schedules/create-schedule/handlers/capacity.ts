import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, Min } from 'class-validator'

export class Capacity {
  @Expose()
  @Type(() => Number)
  @IsNotEmpty({ message: 'Enter a capacity for the schedule' })
  @Min(1, { message: 'Enter a capacity for the schedule more than 0' })
  capacity: number
}

export default class CapacityRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/manage-schedules/create-schedule/capacity')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createScheduleJourney.capacity = req.body.capacity
    res.redirectOrReturn('check-answers')
  }
}
