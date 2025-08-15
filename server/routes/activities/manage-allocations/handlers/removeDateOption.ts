import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'

enum Options {
  CHANGE = 'change',
  REMOVE = 'remove',
}

export class RemoveDateOption {
  @Expose()
  @IsIn(Object.values(Options), { message: 'Select if you want to change the allocation end date or remove it' })
  endDateOption: string
}

export default class RemoveDateOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/manage-allocations/remove-date-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { allocationId } = req.params
    const { user } = res.locals

    if (req.body.endDateOption === Options.CHANGE) {
      return res.redirect(`end-date${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
    }

    req.journeyData.allocateJourney.endDate = null

    if (req.routeContext.mode === 'edit') {
      const allocationUpdate = { removeEndDate: true }
      await this.activitiesService.updateAllocation(+allocationId, allocationUpdate, user)

      const successMessage = `You have removed the end date for this allocation`
      return res.redirectWithSuccess(
        `/activities/allocations/view/${allocationId}`,
        'Allocation updated',
        successMessage,
      )
    }

    if (
      config.multiplePrisonerActivityAllocationEnabled &&
      req.journeyData.allocateJourney.allocateMultipleInmatesMode &&
      req.query.preserveHistory
    )
      return res.redirect('multiple/check-answers')
    return res.redirect(`check-answers`)
  }
}
