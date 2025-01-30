import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { DeallocationReasonCode } from '../../../../../@types/activitiesAPI/types'
import { DeallocateAfterAllocationDateOption } from '../../journey'

export default class DeallocationCheckAndConfirmRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { deallocationReason } = req.session.allocateJourney
    const { notInWorkActivity } = req.query

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-check-and-confirm', {
      activityIsUnemployment: !!notInWorkActivity,
      deallocationReason: deallocationReasons.find(r => r.code === deallocationReason),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmates, activity, endDate, deallocationReason, scheduledInstance, deallocateAfterAllocationDateOption } =
      req.session.allocateJourney
    const { user } = res.locals

    const scheduleInstanceId =
      deallocateAfterAllocationDateOption === DeallocateAfterAllocationDateOption.NOW ? scheduledInstance.id : null

    const { prisonerNumber } = inmates[0]
    console.log(
      activity.scheduleId,
      [prisonerNumber],
      (deallocationReason || 'TRANSFERRED') as DeallocationReasonCode,
      null,
      endDate,
      user,
      scheduleInstanceId,
    )
    // await this.activitiesService.deallocateFromActivity(
    //   activity.scheduleId,
    //   [prisonerNumber],
    //   (deallocationReason || 'TRANSFERRED') as DeallocationReasonCode,
    //   null,
    //   endDate,
    //   user,
    //   scheduleInstanceId,
    // )

    // return res.redirect('deallocation-confirmation')
  }
}
