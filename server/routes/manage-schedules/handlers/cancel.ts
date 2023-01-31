import { Request, Response } from 'express'

export default class CancelRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.redirect('activities')
  }
}
