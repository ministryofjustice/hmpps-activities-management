import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, MaxLength } from 'class-validator'

export class Name {
  @Expose()
  @IsNotEmpty({ message: 'Enter the name of the activity' })
  @MaxLength(40, { message: 'You must enter a name which has no more than 40 characters' })
  name: string
}

export default class NameRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/create-an-activity/name`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.name = req.body.name
    res.redirectOrReturn(`risk-level`)
  }
}
