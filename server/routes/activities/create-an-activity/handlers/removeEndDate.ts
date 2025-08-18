import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class RemoveEndDateOptions {
  @Expose()
  @IsNotEmpty({ message: "Select if you want to change or remove this activity's end date" })
  removeEndDate: string
}

export default class RemoveEndDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/remove-end-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.createJourney.hasAtLeastOneValidDay = true

    if (req.body.removeEndDate && req.body.removeEndDate === 'change') {
      if (req.routeContext.mode === 'edit') {
        return res.redirectOrReturn(
          `/activities/edit/${req.journeyData.createJourney.activityId}/end-date?preserveHistory=true`,
        )
      }
      return res.redirectOrReturn('end-date?preserveHistory=true')
    }

    req.journeyData.createJourney.endDate = null
    if (req.routeContext.mode === 'edit') {
      const { user } = res.locals
      const { activityId, name, endDate } = req.journeyData.createJourney
      const activity = { endDate, removeEndDate: true } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)

      const successMessage = `You've successfully removed the end date for ${name}.`
      return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn('check-answers')
  }
}
