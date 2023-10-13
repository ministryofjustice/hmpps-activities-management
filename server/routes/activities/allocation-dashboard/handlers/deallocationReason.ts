import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class DeallocationReason {
  @Expose()
  @IsNotEmpty({ message: 'Select a reason for deallocation' })
  deallocationReason: string
}

export default class DeallocationReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/allocation-dashboard/deallocation-reason', { deallocationReasons, allocationId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationReason } = req.body
    const { allocationId } = req.params
    const { endDate } = req.session.allocateJourney
    const { prisonerNumber } = req.session.allocateJourney.inmate
    const { activityId } = req.session.allocateJourney.activity
    const { user } = res.locals
    const allocationUpdate = { endDate, reasonCode: deallocationReason } as AllocationUpdateRequest
    await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocationUpdate)

    const successMessage = `We've updated the reason for ending this allocation`
    res.redirectWithSuccess(
      `/activities/allocation-dashboard/${activityId}/check-allocation/${prisonerNumber}`,
      'Allocation updated',
      successMessage,
    )
  }
}
