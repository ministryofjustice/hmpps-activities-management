import { Request, Response } from 'express'

export default class CheckPayRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { educationLevels } = req.session.createJourney
    const { fromReview } = req.query

    if (!req.session.createJourney.fromReview) {
      req.session.createJourney.fromReview = fromReview === 'true'
    }

    res.render(`pages/create-an-activity/check-education-level`, { educationLevels })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.session.createJourney.fromReview) {
      delete req.session.createJourney.fromReview
      return res.redirect(`check-answers`)
    }

    return res.redirect(`start-date`)
  }
}
