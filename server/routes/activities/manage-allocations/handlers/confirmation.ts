import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import ActivitiesService from '../../../../services/activitiesService'
import { Allocation } from '../../../../@types/activitiesAPI/types'

export default class ConfirmationRoutes {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity, activitiesToDeallocate } = req.journeyData.allocateJourney

    if (req.routeContext.mode === 'create') {
      const allocationEvent = MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(
        req.journeyData.allocateJourney,
        res.locals.user,
      ).addJourneyCompletedMetrics(req)
      this.metricsService.trackEvent(allocationEvent)
    }

    let otherAllocations: Allocation[] = []
    if (req.routeContext.mode === 'create') {
      const [prisonerAllocationsList] = await this.activitiesService.getActivePrisonPrisonerAllocations(
        [inmate.prisonerNumber],
        res.locals.user,
      )
      const { allocations } = prisonerAllocationsList
      if (allocations.length) {
        otherAllocations = allocations.filter(a => a.scheduleId !== req.journeyData.allocateJourney.activity.scheduleId)
      }
    }
    const deallocateMultipleActivitiesMode = req.routeContext.mode === 'remove' && activitiesToDeallocate?.length > 0

    res.render('pages/activities/manage-allocations/confirmation', {
      activityId: activity?.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: deallocateMultipleActivitiesMode ? `${activitiesToDeallocate.length} activities` : activity?.name,
      otherAllocations: req.routeContext.mode === 'create' ? otherAllocations : null,
      deallocateMultipleActivitiesMode,
    })
  }
}
