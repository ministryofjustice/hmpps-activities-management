import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney

    res.render('pages/allocate-to-activity/check-answers', {
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      cellLocation: inmate.cellLocation,
      payBand: inmate.payBand.alias,
      activityName: activity.name,
      activityLocation: activity.location,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney
    const { user } = res.locals

    await this.activitiesService.allocateToSchedule(activity.scheduleId, inmate.prisonerNumber, inmate.payBand.id, user)

    res.redirect('confirmation')
  }
}
