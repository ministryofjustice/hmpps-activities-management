import { Request, Response } from 'express'

export default class AdministrationRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/administration/admin', {})
  }
}
