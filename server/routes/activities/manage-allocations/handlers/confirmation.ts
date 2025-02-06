import { Request, Response } from 'express'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import ActivitiesService from '../../../../services/activitiesService'
import { Allocation } from '../../../../@types/activitiesAPI/types'
import config from '../../../../config'

export default class ConfirmationRoutes {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity, activitiesToDeallocate } = req.session.allocateJourney

    if (req.params.mode === 'create') {
      const allocationEvent = MetricsEvent.CREATE_ALLOCATION_JOURNEY_COMPLETED(
        req.session.allocateJourney,
        res.locals.user,
      ).addJourneyCompletedMetrics(req)
      this.metricsService.trackEvent(allocationEvent)
    }

    const deallocateFlagEnabled = config.deallocationAfterAllocationToggleEnabled

    let otherAllocations: Allocation[] = []
    if (deallocateFlagEnabled && req.params.mode === 'create') {
      const [prisonerAllocationsList] = await this.activitiesService.getActivePrisonPrisonerAllocations(
        [inmate.prisonerNumber],
        res.locals.user,
      )
      const { allocations } = prisonerAllocationsList

      if (allocations.length) {
        otherAllocations = allocations.filter(a => a.scheduleId !== req.session.allocateJourney.activity.scheduleId)
      }
    }

    const deallocateMultipleActivitiesMode = req.params.mode === 'remove' && activitiesToDeallocate?.length > 0

    res.render('pages/activities/manage-allocations/confirmation', {
      activityId: activity?.activityId,
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      activityName: deallocateMultipleActivitiesMode ? `${activitiesToDeallocate.length} activities` : activity?.name,
      otherAllocations: deallocateFlagEnabled && req.params.mode === 'create' ? otherAllocations : null,
      deallocateMultipleActivitiesMode,
    })
  }
}
