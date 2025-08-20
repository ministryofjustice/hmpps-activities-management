import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { DeallocationReasonCode } from '../../../../../@types/activitiesAPI/types'
import { DeallocateAfterAllocationDateOption } from '../../journey'
import findNextSchedulesInstance from '../../../../../utils/helpers/nextScheduledInstanceCalculator'

export default class DeallocationCheckAndConfirmRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { deallocationReason, activity } = req.journeyData.allocateJourney
    const notInWorkActivity = activity?.notInWork || false

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-check-and-confirm', {
      activityIsUnemployment: notInWorkActivity,
      deallocationReason:
        notInWorkActivity === false ? deallocationReasons.find(r => r.code === deallocationReason) : null,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const {
      inmates,
      activity,
      endDate,
      deallocationReason,
      scheduledInstance,
      deallocateAfterAllocationDateOption,
      activitiesToDeallocate,
    } = req.journeyData.allocateJourney
    const { user } = res.locals

    const { prisonerNumber } = inmates[0]

    if (activitiesToDeallocate) {
      await Promise.all(
        activitiesToDeallocate.map(async act => {
          let scheduleInstanceId = null
          if (deallocateAfterAllocationDateOption === DeallocateAfterAllocationDateOption.NOW) {
            scheduleInstanceId = findNextSchedulesInstance(act.schedule).id
          }
          await this.activitiesService.deallocateFromActivity(
            act.scheduleId,
            [prisonerNumber],
            (deallocationReason || 'TRANSFERRED') as DeallocationReasonCode,
            null,
            endDate,
            user,
            scheduleInstanceId,
          )
        }),
      )
    } else {
      const scheduleInstanceId =
        deallocateAfterAllocationDateOption === DeallocateAfterAllocationDateOption.NOW ? scheduledInstance.id : null

      await this.activitiesService.deallocateFromActivity(
        activity.scheduleId,
        [prisonerNumber],
        (deallocationReason || 'TRANSFERRED') as DeallocationReasonCode,
        null,
        endDate,
        user,
        scheduleInstanceId,
      )
    }

    return res.redirect('confirmation')
  }
}
