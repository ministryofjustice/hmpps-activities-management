import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import { YesNo } from '../../../../../@types/activities'

export class ReinstateForm {
  @Expose()
  @IsEnum(YesNo, { message: 'Select if you want to reinstate this application or not' })
  reinstate: YesNo
}

export default class ReinstateRoutes {
  constructor() {}

  GET = async (req: Request, res: Response) => {
    return res.render('pages/activities/waitlist-application/reinstate', {})
  }

  POST = async (req: Request, res: Response) => {
    const { reinstate } = req.body

    if (reinstate === YesNo.YES) {
      return res.redirect('./reinstate-reason')
    }
    return res.redirect('./view')
  }
}
