import { Request, Response } from 'express'

export default class RemovePayRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { iep } = req.query
    const bandId = +req.query.bandId

    req.session.createJourney.pay = req.session.createJourney.pay.filter(
      p => p.bandId !== bandId || p.incentiveLevel !== iep,
    )

    res.redirect('check-pay')
  }
}
