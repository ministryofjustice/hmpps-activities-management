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
    const {
      inmates,
      withoutMatchingIncentiveLevelInmates,
      allocatedInmates,
      activity,
      notFoundPrisoners,
      unidentifiable,
    } = req.journeyData.allocateJourney
    const { scheduleId } = activity
    const { fromActivity, csv } = req.query

    const activityCopied = fromActivity !== undefined ? fromActivity : undefined

    if (unidentifiable) {
      return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList', {
        unidentifiable,
      })
    }

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

      const act = await this.activitiesService.getActivity(activity.activityId, user)
      if (act.paid) {
        // get incentive level for the activity
        const withoutMatchingIncentiveLevel: Inmate[] = inmatesWithoutMatchingIncentiveLevel(unallocatedInmates, act)

        // update for matching incentive levels
        unallocatedInmates = inmatesWithMatchingIncentiveLevel(unallocatedInmates, act)

        req.journeyData.allocateJourney.withoutMatchingIncentiveLevelInmates = withoutMatchingIncentiveLevel
      } else {
        req.journeyData.allocateJourney.withoutMatchingIncentiveLevelInmates = []
      }
      req.journeyData.allocateJourney.inmates = unallocatedInmates
      req.journeyData.allocateJourney.allocatedInmates = allocated
    }

    let cannotAllocateMessage
    const cannotAllocate: number =
      req.journeyData.allocateJourney.withoutMatchingIncentiveLevelInmates.length +
      req.journeyData.allocateJourney.allocatedInmates.length
    if (cannotAllocate > 0) {
      if (cannotAllocate === 1) {
        cannotAllocateMessage = '1 person from '
      } else {
        cannotAllocateMessage = `${cannotAllocate} people from `
      }
      cannotAllocateMessage += activityCopied
        ? `${activityCopied} cannot be allocated to ${activity.name}`
        : ' your CSV file cannot be allocated'
    }

    let nobodyToAllocateTitle
    if (req.journeyData.allocateJourney.inmates.length < 1) {
      nobodyToAllocateTitle = `No-one from ${activityCopied || `your CSV`} can be allocated`
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/reviewUploadPrisonerList', {
      unallocatedInmates: req.journeyData.allocateJourney.inmates,
      withoutMatchingIncentiveLevelInmates: req.journeyData.allocateJourney.withoutMatchingIncentiveLevelInmates,
      allocatedInmates: req.journeyData.allocateJourney.allocatedInmates,
      cannotAllocateMessage,
      nobodyToAllocateTitle,
      notFoundPrisoners,
      csv,
    })
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params
    const unallocatedInmates = req.journeyData.allocateJourney.inmates.filter(
      prisoner => prisoner.prisonerNumber !== prisonNumber,
    )
    req.journeyData.allocateJourney.inmates = unallocatedInmates

    res.redirect('../../review-upload-prisoner-list')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    res.redirect('activity-requirements-review')
  }
}
