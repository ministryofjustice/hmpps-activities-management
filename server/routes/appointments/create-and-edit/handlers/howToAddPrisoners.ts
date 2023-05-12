import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import EditAppointmentService from '../../../../services/editAppointmentService'

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
  constructor(private readonly editAppointmentService: EditAppointmentService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create-and-edit/how-to-add-prisoners', {
      backLinkHref: this.editAppointmentService.getBackLinkHref(req, '/appointments'),
      HowToAddOptions,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { howToAdd } = req.body

    if (HowToAddOptions[howToAdd] === HowToAddOptions.CSV) {
      res.redirect('upload-by-csv')
    } else {
      res.redirect('select-prisoner')
    }
  }
}
