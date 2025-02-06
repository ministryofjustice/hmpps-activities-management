import { Request, Response } from 'express'
import { IsNotEmpty } from 'class-validator'
import { Expose } from 'class-transformer'
import ActivitiesService from '../../../../../services/activitiesService'
import { getScheduleIdFromActivity } from '../../../../../utils/utils'
import { AllocateToActivityJourney } from '../../journey'
import findNextSchedulesInstance, {
  findEarliestNextInstanceFromListOfActivities,
} from '../../../../../utils/helpers/nextScheduledInstanceCalculator'

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
      req.session.allocateJourney.scheduledInstance = findNextSchedulesInstance(activity.schedules[0])
    } else {
      const selectedOtherAllocations = req.session.allocateJourney.otherAllocations.filter(all =>
        selectedAllocationIds.includes(all.id.toString()),
      )
      const activities = await Promise.all(
        selectedOtherAllocations.map(all => this.activitiesService.getActivity(all.activityId, user)),
      )

      req.session.allocateJourney.activitiesToDeallocate = activities.map(act => ({
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
      req.session.allocateJourney.scheduledInstance = findEarliestNextInstanceFromListOfActivities(
        activities.map(act => findNextSchedulesInstance(act.schedules[0])),
      )
    }

    return res.redirect('deallocate-after-allocation-date')
  }
}
