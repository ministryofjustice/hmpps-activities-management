import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import { YesNo } from '../../../../@types/activities'

export class AddAnotherForm {
  @Expose()
  @IsEnum(YesNo, { message: 'Select whether you want to add another prisoner' })
  addAnother: YesNo
}

export default class ReviewPrisonerRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/create/review-prisoners')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { addAnother } = req.body

    if (YesNo[addAnother] === YesNo.YES) {
      res.redirect('how-to-add-prisoners')
    } else {
      res.redirect('category')
    }
  }
}
