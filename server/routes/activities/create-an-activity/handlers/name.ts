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
    const { user } = res.locals
    const { category } = req.session.createJourney
    const editJourney = req.params.mode === 'edit'
    req.session.createJourney.name = req.body.name

    const activities = await this.activitiesService.getActivities(true, user)
    const activityNames = activities.map(activity => ({ name: activity.activityName, id: activity.id }))
    const duplicateEditName = activityNames.find(
      activity =>
        activity.name === req.session.createJourney.name && activity.id !== req.session.createJourney.activityId,
    )
    const duplicateCreateName = activityNames.find(activity => activity.name === req.session.createJourney.name)

    if (editJourney && duplicateEditName) {
      return res.validationFailed(
        'name',
        `You need to enter a different name - there is already ${req.session.createJourney.name} for this prison`,
      )
    }
    if (editJourney) {
      const { activityId } = req.session.createJourney
      const activity = {
        summary: req.session.createJourney.name,
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the activity name for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    if (duplicateCreateName) {
      return res.validationFailed('name', 'Enter a different name. There is already an activity with this name')
    }
    // If not in work no need to ask for activity tier
    const nextRoute = category?.code === 'SAA_NOT_IN_WORK' ? 'risk-level' : 'tier'
    return res.redirectOrReturn(nextRoute)
  }
}
