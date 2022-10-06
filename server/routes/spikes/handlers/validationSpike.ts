import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class ValidatedType {
  @Expose()
  @IsNotEmpty({ message: 'This field can not be empty' })
  mustNotBeBlank: string
}

export default class ValidationSpikeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/spikes/validationSpike/index')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('/spikes/validation-spike/success')
  }

  SUCCESS = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/spikes/validationSpike/success')
  }
}
