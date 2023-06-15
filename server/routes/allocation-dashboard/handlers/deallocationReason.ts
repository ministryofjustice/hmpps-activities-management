import { Request, Response } from 'express'
import { Expose, plainToInstance } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import { formatDate } from '../../../utils/utils'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import { AllocationUpdateRequest } from '../../../@types/activitiesAPI/types'

export class DeallocationReason {
  @Expose()
  @IsNotEmpty({ message: 'Select a reason for deallocation' })
  deallocationReason: string
}

export default class DeallocationReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/allocation-dashboard/deallocation-reason', { deallocationReasons })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationReason } = req.body
    const { allocationId } = req.params
    const { endDate } = req.session.allocateJourney
    const { prisonerNumber } = req.session.allocateJourney.inmate
    const { scheduleId } = req.session.allocateJourney.activity
    const { user } = res.locals
    const prisonCode = user.activeCaseLoadId
    const allocation = {
      endDate: formatDate(plainToInstance(SimpleDate, endDate), 'yyyy-MM-dd'),
      reasonCode: deallocationReason,
    } as AllocationUpdateRequest
    await this.activitiesService.updateAllocation(prisonCode, +allocationId, allocation)
    const successMessage = `We've updated the end date for this allocation`

    res.redirectOrReturnWithSuccess(
      `/allocation-dashboard/${scheduleId}/check-allocation/${prisonerNumber}`,
      'Allocation updated',
      successMessage,
    )
  }
}
