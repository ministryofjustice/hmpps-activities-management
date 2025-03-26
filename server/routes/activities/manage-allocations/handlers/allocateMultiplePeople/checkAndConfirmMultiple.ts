import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { StartDateOption } from '../../journey'

export default class CheckAndConfirmMultipleRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    res.render('pages/activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmates, activity, scheduledInstance, startDate, endDate, startDateOption } = req.session.allocateJourney
    const { user } = res.locals

    await Promise.all(
      inmates.map(inmate =>
        this.activitiesService.allocateToSchedule(
          activity.scheduleId,
          inmate.prisonerNumber,
          inmate.payBand.id,
          user,
          startDate,
          endDate,
          [],
          startDateOption === StartDateOption.NEXT_SESSION ? scheduledInstance?.id : null,
        ),
      ),
    )
    res.redirect('confirmation')
  }
}
