import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'

export enum HowToAddOptions {
  SEARCH = 'SEARCH',
  CSV = 'CSV',
}
export class HowToAddPrisonersForm {
  @Expose()
  @IsEnum(HowToAddOptions, { message: 'Select how to add prisoners' })
  howToAdd: HowToAddOptions
}

export default class HowToAddPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create/how-to-add-prisoners', { HowToAddOptions })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { howToAdd } = req.body

    if (HowToAddOptions[howToAdd] === HowToAddOptions.CSV) {
      throw new Error('Not implemented')
    } else {
      res.redirect('select-prisoner')
    }
  }
}
