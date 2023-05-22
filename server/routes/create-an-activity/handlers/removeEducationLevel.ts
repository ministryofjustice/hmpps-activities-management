import { Request, Response } from 'express'

export default class RemoveEducationLevelRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.query

    req.session.createJourney.educationLevels = req.session.createJourney.educationLevels.filter(
      p => p.educationLevelCode !== code,
    )

    if (req.query && req.query.fromEditActivity) res.redirect(`check-education-level?fromEditActivity=true`)
    else res.redirect('check-education-level')
  }
}
