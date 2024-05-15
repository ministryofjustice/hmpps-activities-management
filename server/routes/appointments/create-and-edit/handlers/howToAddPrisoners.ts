import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'

export enum HowToAddOptions {
  SEARCH = 'SEARCH',
  CSV = 'CSV',
}
export class HowToAddPrisonersForm {
  @Expose()
  @IsEnum(HowToAddOptions, { message: 'You must select one option' })
  howToAdd: HowToAddOptions
}

export default class HowToAddPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query
    const { appointmentJourney } = req.session

    res.render('pages/appointments/create-and-edit/how-to-add-prisoners', {
      preserveHistory,
      HowToAddOptions,
      appointmentJourney,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query
    const { howToAdd } = req.body

    if (HowToAddOptions[howToAdd] === HowToAddOptions.CSV) {
      res.redirect(`upload-prisoner-list${preserveHistory ? '?preserveHistory=true' : ''}`)
    } else {
      res.redirect(`select-prisoner${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
  }
}
