import { Request, Response } from 'express'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import { calculateUniqueSlots, mapSlotsToWeeklyTimeSlots } from '../../../../utils/helpers/activityTimeSlotMappers'

export default class ConfirmExclusionsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { exclusions, updatedExclusions } = req.session.allocateJourney

    const newSlots = calculateUniqueSlots(updatedExclusions, exclusions)
    const removedSlots = calculateUniqueSlots(exclusions, updatedExclusions)

    res.render('pages/activities/manage-allocations/confirm-exclusions', {
      newSlots: mapSlotsToWeeklyTimeSlots(newSlots),
      removedSlots: mapSlotsToWeeklyTimeSlots(removedSlots),
    })
  }

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { mode, allocationId } = req.params
    const { exclusions, updatedExclusions, activity, inmate } = req.session.allocateJourney

    const newSlots = calculateUniqueSlots(updatedExclusions, exclusions)
    const removedSlots = calculateUniqueSlots(exclusions, updatedExclusions)

    if (newSlots.length > 0 || removedSlots.length > 0) {
      const allocation = { exclusions: updatedExclusions } as AllocationUpdateRequest
      await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocation)

      if (mode === 'edit') {
        const successMessage = `You've updated the exclusions for this allocation`
        return res.redirectWithSuccess(
          `/activities/allocations/view/${allocationId}`,
          'Allocation updated',
          successMessage,
        )
      }

      // mode === 'exclude'
      return res.redirectWithSuccess(
        `/activities/exclusions/prisoner/${inmate.prisonerNumber}`,
        `You have updated when ${inmate.prisonerName} should attend ${activity.name}`,
      )
    }

    if (mode === 'edit') {
      return res.redirect(`/activities/allocations/view/${allocationId}`)
    }
    return res.redirect(`/activities/exclusions/prisoner/${inmate.prisonerNumber}`)
  }
}
