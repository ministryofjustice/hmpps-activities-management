import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class OrganiserForm {
  @Expose()
  @IsEnum(Organiser, { message: 'Select an organiser' })
  organiser: string
}

export default class OrganiserRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/create-an-activity/organiser', { organiserDescriptions })

  POST = async (req: Request, res: Response): Promise<void> => {
    const { organiser }: OrganiserForm = req.body

    req.session.createJourney.organiserCode = organiser

    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const activity = {
        organiserCode: req.session.createJourney.organiserCode,
        tierCode: req.session.createJourney.tierCode,
        attendanceRequired: req.session.createJourney.attendanceRequired,
      } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `We've updated the organiser for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      return res.redirectWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn('risk-level')
  }
}
