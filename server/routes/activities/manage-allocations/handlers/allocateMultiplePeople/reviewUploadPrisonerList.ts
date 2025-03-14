import { Request, Response } from 'express'
import PrisonService from '../../../../../services/prisonService'
import ActivityService from '../../../../../services/activitiesService'
import { Allocation, PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'
import {
  addOtherAllocations,
  inmatesAllocated,
  inmatesWithMatchingIncentiveLevel,
  inmatesWithoutMatchingIncentiveLevel,
} from '../../../../../utils/helpers/allocationUtil'
import { Inmate } from '../../journey'

export default class ReviewUploadPrisonerListRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivityService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { inmates, activity } = req.session.allocateJourney
    const { scheduleId } = activity

    // get current allocations
    const currentlyAllocated: Allocation[] = await this.activitiesService.getAllocationsWithParams(
      scheduleId,
      { includePrisonerSummary: true },
      user,
    )

    const allocatedInmates: Inmate[] = inmatesAllocated(inmates, currentlyAllocated, false)
    let unallocatedInmates: Inmate[] = inmatesAllocated(inmates, currentlyAllocated, true)

    const unallocatedPrisonerNumbers: string[] = unallocatedInmates.map(inmate => inmate.prisonerNumber)

    // get other allocations for the unallocated prisoners
    const prisonerAllocationsList: PrisonerAllocations[] =
      await this.activitiesService.getActivePrisonPrisonerAllocations(unallocatedPrisonerNumbers, user)
    addOtherAllocations(unallocatedInmates, prisonerAllocationsList, activity.scheduleId)

    // get incentive level for the activity
    const act = await this.activitiesService.getActivity(activity.activityId, user)
    const withoutMatchingIncentiveLevelInmates: Inmate[] = inmatesWithoutMatchingIncentiveLevel(unallocatedInmates, act)

    // update for matching incentive levels
    unallocatedInmates = inmatesWithMatchingIncentiveLevel(unallocatedInmates, act)

    req.session.allocateJourney.inmates = unallocatedInmates

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList', {
      unallocatedInmates,
      withoutMatchingIncentiveLevelInmates,
      allocatedInmates,
    })
  }

  // POST = async (req: Request, res: Response): Promise<void> => {
  //   const { user } = res.locals
  // }
}
