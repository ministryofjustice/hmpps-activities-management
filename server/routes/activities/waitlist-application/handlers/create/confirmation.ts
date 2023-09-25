import { Request, Response } from 'express'
import { trackEvent } from '../../../../../utils/eventTrackingAppInsights'
import ActivitiesService from '../../../../../services/activitiesService'
import { RequesterEnum } from './requester'

export default class ConfirmationRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { waitListApplicationJourney } = req.session
    const { user } = res.locals
    const { activityId, activityName, scheduleId } = waitListApplicationJourney.activity
    const { prisonerNumber } = waitListApplicationJourney.prisoner
    const { status, requester } = waitListApplicationJourney

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

    const properties = {
      user: res.locals.user.username,
      prisonCode: res.locals.user.activeCaseLoadId,
      prisonerNumber,
      activityId: activityId?.toString(),
      activityDescription: activityName,
      prisonerWaitingId: currentWaitlist.filter(w => w.prisonerNumber === prisonerNumber)[0]?.id?.toString(),
      status,
      requester: requester === RequesterEnum.PRISONER ? 'Prisoner' : requester,
      requestDate: Date.now().toString(),
    }

    const eventMetrics = {
      journeyTimeSec: (Date.now() - req.session.journeyStartTime) / 1000,
    }

    trackEvent({
      eventName: 'SAA-Waitlist-New-Application',
      properties,
      eventMetrics,
    })

    req.session.waitListApplicationJourney = undefined
  }
}
