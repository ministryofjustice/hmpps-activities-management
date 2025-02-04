import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { getScheduleIdFromActivity } from '../../../../../utils/utils'

export default class DeallocationSelectActivities {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { otherAllocations } = req.session.allocateJourney
    res.render('pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-select-activities', {
      otherAllocations,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedAllocations } = req.body
    const selectedAllocationIds = selectedAllocations.toString().split(',')

    if (selectedAllocationIds.length === 1) {
      const [allocation] = req.session.allocateJourney.otherAllocations.filter(
        all => all.id === +selectedAllocationIds[0],
      )
      const activity = await this.activitiesService.getActivity(allocation.activityId, user)
      req.session.allocateJourney.activity = {
        activityId: activity.id,
        scheduleId: getScheduleIdFromActivity(activity),
        name: activity.summary,
        startDate: activity.startDate,
        endDate: activity.endDate,
        scheduleWeeks: activity.schedules[0].scheduleWeeks,
        location: activity.schedules[0].internalLocation?.description,
        inCell: activity.inCell,
        onWing: activity.onWing,
        offWing: activity.offWing,
      }
    } else {
      // Filter req.session.allocateJourney.otherAllocations to get the allocations associated with the ids that have been chosen
      // get the activities associated with those allocation numbers
      // append these onto the session using activitiesToDeallocate field
    }
    // return res.redirect('deallocate-after-allocation-date')
  }
}
