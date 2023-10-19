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

    res.render('pages/activities/manage-allocations/deallocation-reason', { deallocationReasons, allocationId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationReason } = req.body
    const { allocationId } = req.params
    const { endDate } = req.session.allocateJourney
    const { user } = res.locals

    req.session.allocateJourney.deallocationReason = deallocationReason

    if (req.params.mode === 'edit') {
      const allocationUpdate = { endDate, reasonCode: deallocationReason } as AllocationUpdateRequest
      await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocationUpdate)

      const successMessage = `You've updated the reason for ending this allocation`
      return res.redirectWithSuccess(
        `/activities/allocations/view/${allocationId}`,
        'Allocation updated',
        successMessage,
      )
    }
    return res.redirect('check-answers')
  }
}
