import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNumber, Max, Min } from 'class-validator'

export class Capacity {
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'Enter a capacity for the activity' })
  @Min(1, { message: 'Enter a capacity for the activity more than 0' })
  @Max(999, { message: 'Enter a capacity for the activity less than 1000' })
  capacity: number
}

export default class CapacityRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create-an-activity/capacity')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.capacity = req.body.capacity
    res.redirectOrReturn('check-answers')
  }
}
