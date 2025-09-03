import { Request, Response } from 'express'
import { IsNotEmpty } from 'class-validator'
import { Expose } from 'class-transformer'
import ActivitiesService from '../../../../../services/activitiesService'
import { getScheduleIdFromActivity } from '../../../../../utils/utils'
import { AllocateToActivityJourney } from '../../journey'
import findNextSchedulesInstance, {
  findEarliestNextInstanceFromListOfActivities,
} from '../../../../../utils/helpers/nextScheduledInstanceCalculator'
import logger from '../../../../../../logger'

export class DeallocationSelect {
  prisonerName: string

  @Expose()
  @IsNotEmpty({
    message: ({ object }) => {
      const { allocateJourney } = object as { allocateJourney: AllocateToActivityJourney }
      return `Select the activities you want to take ${allocateJourney.inmate.prisonerName} off`
    },
  })
  selectedAllocations: string
}

export default class DeallocationSelectActivities {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { otherAllocations } = req.journeyData.allocateJourney
    res.render('pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-select-activities', {
      otherAllocations,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedAllocations } = req.body
    const selectedAllocationIds = selectedAllocations.toString().split(',')

    if (selectedAllocationIds.length === 1) {
      const [allocation] = req.journeyData.allocateJourney.otherAllocations.filter(
        all => all.id === +selectedAllocationIds[0],
      )
      const activity = await this.activitiesService.getActivity(allocation.activityId, user)
      const scheduleId = getScheduleIdFromActivity(activity)

      // this goes onto the activity instead of "activitesToDeallocate" because it mimics the existing deallocate set up, which happens in the initialiseEditAndRemoveJourney middleware
      req.journeyData.allocateJourney.activity = {
        activityId: activity.id,
        scheduleId,
        name: activity.summary,
        startDate: activity.startDate,
        endDate: activity.endDate,
        scheduleWeeks: activity.schedules[0].scheduleWeeks,
        location: activity.schedules[0].internalLocation?.description,
        inCell: activity.inCell,
        onWing: activity.onWing,
        offWing: activity.offWing,
      }
      // We need to protect against the eventuality that a user selects multiple to deallocate, then goes back and only selects one. So we need to wipe activitiesToDeallocate if they have selected only one in this POST
      req.journeyData.allocateJourney.activitiesToDeallocate = null
      const nextScheduledInstance = findNextSchedulesInstance(activity.schedules[0])
      req.journeyData.allocateJourney.scheduledInstance = nextScheduledInstance
      logger.info(
        `User is deallocating from one activity, from ${selectedAllocationIds.length} available. ActivityId: ${activity.id}, activityName: ${activity.summary}, scheduleId: ${scheduleId}. Next scheduled instance id: ${nextScheduledInstance.id}, date: ${nextScheduledInstance.date}, slot: ${nextScheduledInstance.timeSlot}`,
      )
    } else {
      const selectedOtherAllocations = req.journeyData.allocateJourney.otherAllocations.filter(all =>
        selectedAllocationIds.includes(all.id.toString()),
      )
      const activities = await Promise.all(
        selectedOtherAllocations.map(all => this.activitiesService.getActivity(all.activityId, user)),
      )
      req.journeyData.allocateJourney.activitiesToDeallocate = activities.map(act => ({
        activityId: act.id,
        scheduleId: getScheduleIdFromActivity(act),
        name: act.summary,
        startDate: act.startDate,
        endDate: act.endDate,
        scheduleWeeks: act.schedules[0].scheduleWeeks,
        location: act.schedules[0].internalLocation?.description,
        inCell: act.inCell,
        onWing: act.onWing,
        offWing: act.offWing,
        schedule: act.schedules[0],
      }))
      // We need to protect against the eventuality that a user selects one activity to deallocate from, then goes back and selects multiple. So we need to wipe activity if they have selected multiple in this POST
      req.journeyData.allocateJourney.activity = null
      const earliestScheduledInstance = findEarliestNextInstanceFromListOfActivities(
        activities.map(act => findNextSchedulesInstance(act.schedules[0])),
      )
      req.journeyData.allocateJourney.scheduledInstance = earliestScheduledInstance
      const ids = selectedOtherAllocations.map(allocation => allocation.activityId)
      const scheduleIds = selectedOtherAllocations.map(allocation => allocation.scheduleId)
      logger.info(
        `User is deallocating from ${selectedOtherAllocations.length} activies. There were ${req.journeyData.allocateJourney.otherAllocations.length} available. ActivityIds: ${ids}, scheduleIds: ${scheduleIds}. Next scheduled instance (earliest from the activity list): id: ${earliestScheduledInstance.id}, date: ${earliestScheduledInstance.date}, slot: ${earliestScheduledInstance.timeSlot}`,
      )
    }

    return res.redirect('deallocate-after-allocation-date')
  }
}
