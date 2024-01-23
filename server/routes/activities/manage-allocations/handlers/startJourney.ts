import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import { asString, convertToTitleCase } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import MetricsEvent from '../../../../data/metricsEvent'
import { initJourneyMetrics } from '../../../../utils/metricsUtils'
import MetricsService from '../../../../services/metricsService'
import { InmateDetail } from '../../../../@types/prisonApiImport/types'
import { IepSummary } from '../../../../@types/incentivesApi/types'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'

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

    const [inmate, iepSummary, schedule]: [InmateDetail, IepSummary, ActivitySchedule] = await Promise.all([
      this.prisonService.getInmate(prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(prisonerNumber, user),
      this.activitiesService.getActivitySchedule(+scheduleId, user),
    ])

    const inmates = [
      {
        prisonerNumber: inmate.offenderNo,
        prisonerName: convertToTitleCase(`${inmate.firstName} ${inmate.lastName}`),
        prisonCode: inmate.agencyId,
        status: inmate.status,
        cellLocation: inmate.assignedLivingUnit?.description,
        incentiveLevel: iepSummary?.iepLevel,
      },
    ]

    req.session.allocateJourney = {
      inmate: inmates[0],
      inmates,
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
        scheduleWeeks: schedule.scheduleWeeks,
        paid: schedule.activity.paid,
      },
      exclusions: [],
      updatedExclusions: [],
    }

    initJourneyMetrics(req, asString(source))
    this.metricsServices.trackEvent(
      MetricsEvent.CREATE_ALLOCATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
    )

    res.redirect(`../before-you-allocate`)
  }
}
