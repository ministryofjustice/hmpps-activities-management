import { Request, Response } from 'express'
import { IsEnum } from 'class-validator'
import { Expose } from 'class-transformer'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import { YesNo } from '../../../../@types/activities'

export class AddEducation {
  @Expose()
  @IsEnum(YesNo, { message: 'Select an option' })
  addEducation: YesNo
}
export default class CheckEducationLevelHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { educationLevels } = req.session.createJourney

    res.render(`pages/activities/create-an-activity/check-education-level`, { educationLevels })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { addEducation } = req.body
    if (addEducation === YesNo.NO) {
      if (req.params.mode === 'edit') {
        const { user } = res.locals
        const { activityId } = req.session.createJourney
        const activity = {
          minimumEducationLevel: req.session.createJourney.educationLevels,
        } as ActivityUpdateRequest
        await this.activitiesService.updateActivity(activityId, activity, user)
        const successMessage = `You've updated the education levels for ${req.session.createJourney.name}`

        const returnTo = `/activities/view/${req.session.createJourney.activityId}`
        req.session.returnTo = returnTo
        return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
      }
      return res.redirectOrReturn(`start-date`)
    }
    return res.redirect(`education-level${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
