import { Request, Response } from 'express'

export default class CheckPayRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { educationLevels } = req.session.createJourney

    res.render(`pages/create-an-activity/check-education-level`, { educationLevels })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect(`check-answers`)
  }
}
