import { Request, Response } from 'express'

export default class RemoveEducationLevelRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { eduLevel, studyArea, preserveHistory } = req.query

    req.journeyData.createJourney.educationLevels = req.journeyData.createJourney.educationLevels.filter(
      p => p.educationLevelCode !== eduLevel || p.studyAreaCode !== studyArea,
    )

    res.redirect(`check-education-level${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
