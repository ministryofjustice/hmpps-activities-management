import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import SimpleDate from '../../../../../commonValidationTypes/simpleDate'
import ActivitiesService from '../../../../../services/activitiesService'
import { WaitingListApplicationRequest } from '../../../../../@types/activitiesAPI/types'
import { formatDate } from '../../../../../utils/utils'
import MetricsEvent from '../../../../../data/metricsEvent'
import MetricsService from '../../../../../services/metricsService'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly metricsService: MetricsService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisoner, requestDate, activity, requester, comment, status } = req.session.waitListApplicationJourney

    return res.render(`pages/activities/waitlist-application/check-answers`, {
      prisoner,
      requestDate: plainToInstance(SimpleDate, requestDate).toRichDate(),
      activityName: activity.activityName,
      requester,
      comment,
      status,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { waitListApplicationJourney } = req.session

    const waitlistApplication = {
      prisonerNumber: waitListApplicationJourney.prisoner.prisonerNumber,
      activityScheduleId: waitListApplicationJourney.activity.scheduleId,
      applicationDate: formatDate(
        plainToInstance(SimpleDate, waitListApplicationJourney.requestDate).toRichDate(),
        'yyyy-MM-dd',
      ),
      requestedBy: waitListApplicationJourney.requester,
      comments: waitListApplicationJourney.comment,
      status: waitListApplicationJourney.status,
    } as WaitingListApplicationRequest

    await this.activitiesService.logWaitlistApplication(waitlistApplication, user)

    const waitlistEvent = MetricsEvent.WAITLIST_APPLICATION_JOURNEY_COMPLETED(
      waitListApplicationJourney,
      res.locals.user,
    ).setJourneyMetrics(req.session.journeyMetrics)
    this.metricsService.trackEvent(waitlistEvent)

    return res.redirect(`confirmation`)
  }
}
