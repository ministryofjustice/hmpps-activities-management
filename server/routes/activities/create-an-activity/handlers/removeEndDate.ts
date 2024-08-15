import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class RemoveEndDateOptions {
  @Expose()
  @IsNotEmpty({ message: "Please select if you want to change or remove this activity's end date." })
  removeEndDate: string
}

export default class RemoveEndDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/remove-end-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.removeEndDate = req.body.removeEndDate
    if (req.body.removeEndDate && req.body.removeEndDate === 'change') {
      res.redirectOrReturn(`/activities/edit/${req.session.createJourney.activityId}/end-date?preserveHistory=true`)
    } else {
      req.session.createJourney.endDate = null
      const { user } = res.locals
      const { activityId, name, endDate } = req.session.createJourney
      const activity = { endDate, removeEndDate: true } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)

      const successMessage = `You've successfully removed the end date for ${name}.`
      res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }
  }
}
