import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

enum Options {
  CHANGE = 'change',
  REMOVE = 'remove',
}

export class RemoveDateOption {
  @Expose()
  @IsIn(Object.values(Options), { message: 'Choose whether you want to change or remove the end date.' })
  endDateOption: string
}

export default class RemoveDateOptionRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisonerName } = req.session.allocateJourney.inmate

    res.render('pages/activities/manage-allocations/remove-date-option', {
      prisonerName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { allocationId } = req.params
    const { user } = res.locals

    if (req.body.endDateOption === Options.CHANGE) {
      return res.redirect(`end-date${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
    }

    req.session.allocateJourney.endDate = null

    if (req.params.mode === 'edit') {
      const allocationUpdate = { removeEndDate: true }
      await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocationUpdate)

      const successMessage = `You have removed the end date for this allocation`
      return res.redirectWithSuccess(
        `/activities/allocations/view/${allocationId}`,
        'Allocation updated',
        successMessage,
      )
    }

    return res.redirect(`check-answers`)
  }
}