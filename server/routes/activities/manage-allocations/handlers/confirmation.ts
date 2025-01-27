import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import ActivitiesService from '../../../../services/activitiesService'
import { Allocation } from '../../../../@types/activitiesAPI/types'
import { getScheduleIdFromActivity } from '../../../../utils/utils'

export default class ConfirmationRoutes {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney

    if (req.params.mode === 'create') {
      const allocationEvent = MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(
        req.session.allocateJourney,
        res.locals.user,
      ).addJourneyCompletedMetrics(req)
      this.metricsService.trackEvent(allocationEvent)
    }

    const [prisonerAllocationsList] = await this.activitiesService.getActivePrisonPrisonerAllocations(
      [inmate.prisonerNumber],
      res.locals.user,
    )
    const { allocations } = prisonerAllocationsList

    let otherAllocations: Allocation[] = []
    if (allocations.length > 0) {
      otherAllocations = allocations.filter(a => a.scheduleId !== req.session.allocateJourney.activity.scheduleId)
    }
    const allocationToEndId = otherAllocations.map(a => a.activityId)
    const allocationToEndScheduleId = otherAllocations.map(a => a.scheduleId)

    const deallocationInfo = {
      linkText: this.getDeallocationText(otherAllocations),
      linkHref: `/activities/allocations/remove/deallocate-after-allocation-date?allocationIds=${allocationToEndId}&scheduleId=${allocationToEndScheduleId}`,
    }

    res.render('pages/activities/manage-allocations/confirmation', {
      activityId: activity.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: activity.name,
      deallocationInfo,
    })
  }

  private getDeallocationText = (otherAllocations: Allocation[]) => {
    if (!otherAllocations.length) return null
    if (otherAllocations.length === 1) {
      return otherAllocations[0].activitySummary
    }
    return `any other activities they’re allocated to`
  }
}
