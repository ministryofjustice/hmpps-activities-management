import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import EducationNotDuplicated from '../../../../validators/educationNotDuplicated'
import { ServiceUser } from '../../../../@types/express'

export class EducationLevel {
  @Expose()
  @IsNotEmpty({ message: 'Select a study area' })
  studyAreaCode: string

  @Expose()
  @IsNotEmpty({ message: 'Select an education level' })
  @EducationNotDuplicated({ message: 'Education already exists on this activity' })
  eduLevelCode: string
}

export default class EducationLevelRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const [studyAreas, eduLevels] = await this.getEducation(user)

    res.render('pages/activities/create-an-activity/education-level', { eduLevels, studyAreas })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const [studyAreas, eduLevels] = await this.getEducation(user)

    const studyArea = studyAreas.find(r => r.code === req.body.studyAreaCode)
    const eduLevel = eduLevels.find(r => r.code === req.body.eduLevelCode)

    // Prevent adding non-existant education
    if (!studyArea || !eduLevel) return res.validationFailed('eduLevelCode', 'Education not found')

    req.session.createJourney.educationLevels ??= []

    req.session.createJourney.educationLevels.push({
      studyAreaCode: studyArea.code,
      studyAreaDescription: studyArea.description,
      educationLevelCode: eduLevel.code,
      educationLevelDescription: eduLevel.description,
    })

    if (req.query && req.query.fromEditActivity) return res.redirect(`check-education-level?fromEditActivity=true`)
    return res.redirect(`check-education-level`)
  }

  private getEducation = (user: ServiceUser) =>
    Promise.all([
      this.prisonService.getReferenceCodes('STUDY_AREA', user),
      this.prisonService.getReferenceCodes('EDU_LEVEL', user),
    ]).then(domains => domains.map(d => d.filter(v => v.activeFlag === 'Y')))
}
