import { Request, Response } from 'express'

export default class AllocateHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/allocate-to-activity/home')
  }
}
