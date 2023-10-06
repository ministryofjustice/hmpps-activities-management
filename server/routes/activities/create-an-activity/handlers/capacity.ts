import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsInt, IsNumber, Max, Min } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

const MIN_MAX_CAPACITY_ERROR_MSG =
  'Enter the number of people who can be allocated to this activity. This must be a number between 1 and 999'

export class Capacity {
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: MIN_MAX_CAPACITY_ERROR_MSG })
  @IsInt({ message: MIN_MAX_CAPACITY_ERROR_MSG })
  @Min(1, { message: MIN_MAX_CAPACITY_ERROR_MSG })
  @Max(999, { message: MIN_MAX_CAPACITY_ERROR_MSG })
  capacity: number
}

export default class CapacityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/capacity')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.capacity = req.body.capacity
    if (req.params.mode === 'edit') {
      if (req.body.capacity < req.session.createJourney.allocationCount) {
        return res.redirect('confirm-capacity?preserveHistory=true')
      }
      const { user } = res.locals
      const { activityId, capacity } = req.session.createJourney
      const activity = { capacity } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)
      const successMessage = `We've updated the capacity for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn('check-answers')
  }
}
