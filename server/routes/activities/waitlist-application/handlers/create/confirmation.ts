import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

export default class ConfirmationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { waitListApplicationJourney } = req.session
    const { user } = res.locals
    const { activityId, scheduleId } = waitListApplicationJourney.activity

    const { capacity, allocated } = await this.activitiesService
      .getActivity(activityId, user)
      .then(a => a.schedules[0].activity)

    const currentWaitlist = await this.activitiesService
      .fetchActivityWaitlist(scheduleId, user)
      .then(waitlist => waitlist.filter(w => w.status === 'PENDING' || w.status === 'APPROVED'))

    res.render('pages/activities/waitlist-application/confirmation', {
      waitListApplicationJourney,
      waitlistSize: currentWaitlist.length,
      vacancies: capacity - allocated,
      currentlyAllocated: allocated,
      capacity,
    })

    req.session.waitListApplicationJourney = undefined
  }
}
