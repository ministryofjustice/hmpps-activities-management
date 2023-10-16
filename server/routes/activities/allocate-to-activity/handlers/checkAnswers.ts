import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/allocate-to-activity/check-answers')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity, startDate, endDate } = req.session.allocateJourney
    const { user } = res.locals

    await this.activitiesService.allocateToSchedule(
      activity.scheduleId,
      inmate.prisonerNumber,
      inmate.payBand.id,
      user,
      startDate,
      endDate,
    )

    res.redirect('confirmation')
  }
}
