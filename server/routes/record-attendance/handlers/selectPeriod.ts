import { Request, Response } from 'express'

export default class SelectPeriodRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/record-attendance/select-period')
  }
}
