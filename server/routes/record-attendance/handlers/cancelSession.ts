import { Request, Response } from 'express'

export default class CancelSessionRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/record-attendance/cancel-reason')
}
