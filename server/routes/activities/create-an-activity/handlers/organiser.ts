import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsEnum } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import Organiser, { organiserDescriptions } from '../../../../enum/organisers'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class OrganiserForm {
  @Expose()
  @Type(() => Number)
  @IsEnum(Organiser, { message: 'Select an organiser' })
  organiser: number
}

export default class OrganiserRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/create-an-activity/organiser', { organiserDescriptions })

  POST = async (req: Request, res: Response): Promise<void> => {
    const { organiser }: OrganiserForm = req.body

    req.session.createJourney.organiserId = organiser

    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const activity = {
        organiserId: req.session.createJourney.organiserId,
        tierId: req.session.createJourney.tierId,
      } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)
      const successMessage = `We've updated the organiser for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      return res.redirectWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn('risk-level')
  }
}
