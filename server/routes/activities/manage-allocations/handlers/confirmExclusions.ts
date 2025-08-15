import { Request, Response } from 'express'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import {
  calculateExclusionSlots,
  calculateUniqueSlots,
  mapSlotsToWeeklyTimeSlots,
  mergeExclusionSlots,
} from '../../../../utils/helpers/activityTimeSlotMappers'

export default class ConfirmExclusionsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { exclusions, updatedExclusions } = req.journeyData.allocateJourney

    const excludedSlots = calculateExclusionSlots(updatedExclusions, exclusions)
    const addedSlots = calculateExclusionSlots(exclusions, updatedExclusions)

    const schedule = await this.activitiesService.getActivitySchedule(
      req.journeyData.allocateJourney.activity.scheduleId,
      user,
    )

    res.render('pages/activities/manage-allocations/confirm-exclusions', {
      excludedSlots: mapSlotsToWeeklyTimeSlots(excludedSlots, schedule.slots),
      addedSlots: mapSlotsToWeeklyTimeSlots(addedSlots, schedule.slots),
    })
  }

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { allocationId } = req.params
    const { mode } = req.routeContext
    const { exclusions, updatedExclusions, activity, inmate } = req.journeyData.allocateJourney

    const newSlots = calculateUniqueSlots(updatedExclusions, exclusions)
    const removedSlots = calculateUniqueSlots(exclusions, updatedExclusions)

    if (newSlots.length > 0 || removedSlots.length > 0) {
      const mergedExclusions = mergeExclusionSlots(updatedExclusions)

      const allocation = { exclusions: mergedExclusions } as AllocationUpdateRequest
      await this.activitiesService.updateAllocation(+allocationId, allocation, user)

      const successMessage = `You have changed when ${inmate.prisonerName} should attend ${activity.name}`

      if (mode === 'edit') {
        return res.redirectWithSuccess(
          `/activities/allocations/view/${allocationId}`,
          'Allocation updated',
          successMessage,
        )
      }

      // mode === 'exclude'
      return res.redirectWithSuccess(`/activities/exclusions/prisoner/${inmate.prisonerNumber}`, successMessage)
    }

    if (mode === 'edit') {
      return res.redirect(`/activities/allocations/view/${allocationId}`)
    }
    return res.redirect(`/activities/exclusions/prisoner/${inmate.prisonerNumber}`)
  }
}
