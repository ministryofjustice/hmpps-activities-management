import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class DeallocationReasonOption {
  @Expose()
  @IsNotEmpty({ message: 'Select if you want to change the reason' })
  deallocationReasonOption: string
}

export default class DeallocationReasonOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/manage-allocations/deallocation-reason-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.deallocationReasonOption === 'yes') {
      return res.redirectOrReturn(`reason`)
    }
    return res.redirect(`check-answers`)
  }
}
