import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../services/prisonService'

export class EducationLevel {
  @Expose()
  @Type(() => String)
  @IsNotEmpty({ message: 'Select an education level' })
  referenceCode: string
}

export default class EducationLevelRoutes {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const referenceCodes = await this.prisonService.getReferenceCodes('EDU_LEVEL', user)

    res.render('pages/create-an-activity/education-level', {
      referenceCodes: referenceCodes.filter(el => el.activeFlag === 'Y'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const referenceCode = await this.prisonService
      .getReferenceCodes('EDU_LEVEL', user)
      .then(refCode => refCode.find(r => r.code === req.body.referenceCode))

    if (!req.session.createJourney.educationLevels) {
      req.session.createJourney.educationLevels = []
    }

    req.session.createJourney.educationLevels.push({
      educationLevelCode: referenceCode.code,
      educationLevelDescription: referenceCode.description,
    })

    res.redirect(`check-education-level`)
  }
}
