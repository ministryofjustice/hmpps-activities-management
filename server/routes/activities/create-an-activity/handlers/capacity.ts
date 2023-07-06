import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsInt, IsNumber, Max, Min } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class Capacity {
  @Expose()
  @Type(() => Number)
  @IsNumber({}, { message: 'Enter a capacity for the activity' })
  @IsInt({ message: 'Enter a whole number for the capacity' })
  @Min(1, { message: 'Enter a capacity for the activity more than 0' })
  @Max(999, { message: 'Enter a capacity for the activity less than 1000' })
  capacity: number
}

export default class CapacityRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/capacity')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.capacity = req.body.capacity
    if (req.query && req.query.fromEditActivity) {
      if (req.body.capacity < req.session.createJourney.allocationCount) {
        res.redirectOrReturn('/activities/schedule/confirm-capacity')
      } else {
        const { user } = res.locals
        const { activityId } = req.session.createJourney
        const prisonCode = user.activeCaseLoadId
        const activity = {
          capacity: req.session.createJourney.capacity,
        } as ActivityUpdateRequest
        await this.activitiesService.updateActivity(prisonCode, activityId, activity)
        const successMessage = `We've updated the capacity for ${req.session.createJourney.name}`

        const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
        req.session.returnTo = returnTo
        res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
      }
    } else res.redirectOrReturn('check-answers')
  }
}
