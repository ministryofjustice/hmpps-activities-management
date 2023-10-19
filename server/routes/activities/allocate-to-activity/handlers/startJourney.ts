import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import { asString, convertToTitleCase } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import MetricsEvent from '../../../../data/metricsEvent'
import { initJourneyMetrics } from '../../../../utils/metricsUtils'
import MetricsService from '../../../../services/metricsService'

export default class StartJourneyRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
    private readonly metricsServices: MetricsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId, source } = req.query
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const [inmate, iepSummary, schedule] = await Promise.all([
      this.prisonService.getInmate(prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(prisonerNumber, user),
      this.activitiesService.getActivitySchedule(+scheduleId, user),
    ])

    req.session.allocateJourney = {
      inmate: {
        prisonerNumber: inmate.offenderNo,
        prisonerName: convertToTitleCase(`${inmate.firstName} ${inmate.lastName}`),
        cellLocation: inmate.assignedLivingUnit?.description,
        incentiveLevel: iepSummary?.iepLevel,
      },
      activity: {
        activityId: schedule.activity.id,
        scheduleId: schedule.id,
        name: schedule.description,
        location: schedule.internalLocation?.description,
        inCell: schedule.activity.inCell,
        onWing: schedule.activity.onWing,
        offWing: schedule.activity.offWing,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      },
    }
    initJourneyMetrics(req, asString(source))
    this.metricsServices.trackEvent(
      MetricsEvent.CREATE_ALLOCATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
    )
    res.redirect(`/activities/allocate/before-you-allocate`)
  }
}
