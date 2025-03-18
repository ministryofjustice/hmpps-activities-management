import { Request, Response } from 'express'
import ActivityService from '../../../../../services/activitiesService'
import { Allocation } from '../../../../../@types/activitiesAPI/types'
import {
  inmatesAllocated,
  inmatesWithMatchingIncentiveLevel,
  inmatesWithoutMatchingIncentiveLevel,
} from '../../../../../utils/helpers/allocationUtil'
import { Inmate } from '../../journey'

export default class ReviewUploadPrisonerListRoutes {
  constructor(private readonly activitiesService: ActivityService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { inmates, withoutMatchingIncentiveLevelInmates, allocatedInmates, activity } = req.session.allocateJourney
    const { scheduleId } = activity

    // prisoner without incentive levels and prisoners already allocated haven't been calculated
    if (withoutMatchingIncentiveLevelInmates === undefined && allocatedInmates === undefined) {
      // get current allocations
      const currentlyAllocated: Allocation[] = await this.activitiesService.getAllocationsWithParams(
        scheduleId,
        { includePrisonerSummary: true },
        user,
      )

      const allocated: Inmate[] = inmatesAllocated(inmates, currentlyAllocated, false)
      let unallocatedInmates: Inmate[] = inmatesAllocated(inmates, currentlyAllocated, true)

      // get incentive level for the activity
      const act = await this.activitiesService.getActivity(activity.activityId, user)
      const withoutMatchingIncentiveLevel: Inmate[] = inmatesWithoutMatchingIncentiveLevel(unallocatedInmates, act)

      // update for matching incentive levels
      unallocatedInmates = inmatesWithMatchingIncentiveLevel(unallocatedInmates, act)

      // req.session.allocateJourney.inmates = unallocatedInmates
      req.session.allocateJourney.withoutMatchingIncentiveLevelInmates = withoutMatchingIncentiveLevel
      req.session.allocateJourney.allocatedInmates = allocated
      req.session.allocateJourney.inmates = unallocatedInmates
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList', {
      unallocatedInmates: req.session.allocateJourney.inmates,
      withoutMatchingIncentiveLevelInmates: req.session.allocateJourney.withoutMatchingIncentiveLevelInmates,
      allocatedInmates: req.session.allocateJourney.allocatedInmates,
    })
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params
    const unallocatedInmates = req.session.allocateJourney.inmates.filter(
      prisoner => prisoner.prisonerNumber !== prisonNumber,
    )
    req.session.allocateJourney.inmates = unallocatedInmates

    res.redirect('../../review-upload-prisoner-list')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('activity-requirements-review')
  }
}
