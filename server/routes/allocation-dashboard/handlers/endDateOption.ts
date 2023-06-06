import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { AllocationUpdateRequest } from '../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../services/activitiesService'

export class EndDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want to change or remove the end date.' })
  endDateOption: string
}

export default class EndDateOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params
    const allocation = await this.activitiesService.getAllocation(+allocationId, user)
    const { scheduleId } = allocation
    const { prisonerNumber } = allocation
    res.render('pages/allocation-dashboard/end-date-option', {
      scheduleId,
      allocationId,
      prisonerNumber,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.endDateOption === 'change') {
      res.redirectOrReturn(`end-date`)
    } else {
      const { user } = res.locals
      const { allocationId, prisonerNumber, scheduleId } = req.body
      const prisonCode = user.activeCaseLoadId
      const allocation = {
        removeEndDate: true,
      } as AllocationUpdateRequest
      await this.activitiesService.updateAllocation(prisonCode, allocationId, allocation)
      const successMessage = `We've removed the end date for this allocation`

      res.redirectOrReturnWithSuccess(
        `/allocation-dashboard/${scheduleId}/check-allocation/${prisonerNumber}`,
        'Allocation updated',
        successMessage,
      )
    }
  }
}
