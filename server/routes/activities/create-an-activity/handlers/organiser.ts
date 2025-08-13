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

    req.journeyData.createJourney.organiserCode = organiser

    if (req.routeContext.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.journeyData.createJourney
      const activity = {
        organiserCode: req.journeyData.createJourney.organiserCode,
        tierCode: req.journeyData.createJourney.tierCode,
        attendanceRequired: req.journeyData.createJourney.attendanceRequired,
      } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `We've updated the organiser for ${req.journeyData.createJourney.name}`

      const returnTo = `/activities/view/${req.journeyData.createJourney.activityId}`
      return res.redirectWithSuccess(returnTo, 'Activity updated', successMessage)
    }
    return res.redirectOrReturn('risk-level')
  }
}
