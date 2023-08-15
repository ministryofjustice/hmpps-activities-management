import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class RemoveDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want to change or remove the end date.' })
  endDateOption: string
}

export default class RemoveDateOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate

    res.render('pages/activities/allocate-to-activity/remove-date-option', {
      prisonerName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.endDateOption === 'change') {
      return res.redirect(`end-date?preserveHistory=true`)
    }
    req.session.allocateJourney.endDate = null
    return res.redirect(`/activities/allocate/check-answers`)
  }
}
