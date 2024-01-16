import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, MaxLength } from 'class-validator'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class Name {
  @Expose()
  @IsNotEmpty({ message: 'Enter the name of the activity' })
  @MaxLength(40, { message: 'You must enter a name which has no more than 40 characters' })
  name: string
}

export default class NameRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render(`pages/activities/create-an-activity/name`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { category } = req.session.createJourney
    req.session.createJourney.name = req.body.name
    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const activity = {
        summary: req.session.createJourney.name,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the activity name for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else {
      // If not in work no need to ask for activity tier
      const nextRoute = category?.code === 'SAA_NOT_IN_WORK' ? 'risk-level' : 'tier'
      res.redirectOrReturn(nextRoute)
    }
  }
}
