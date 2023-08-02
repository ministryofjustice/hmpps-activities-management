import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class ConfirmationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { waitListApplicationJourney } = req.session
    const { user } = res.locals

    const { capacity, allocated } = await this.activitiesService
      .getActivity(waitListApplicationJourney.activity.activityId, user)
      .then(a => a.schedules[0].activity)

    res.render('pages/activities/waitlist-application/confirmation', {
      waitListApplicationJourney,
      waitlistSize: 1, // TODO: API call to fetch the current waitlist for the activity
      vacancies: capacity - allocated,
      currentlyAllocated: allocated,
      capacity,
    })
    req.session.waitListApplicationJourney = undefined
  }
}
