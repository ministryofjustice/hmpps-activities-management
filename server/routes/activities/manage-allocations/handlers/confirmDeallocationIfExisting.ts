import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivityService from '../../../../services/activitiesService'

export class ConfirmDeallocateOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  choice: string
}

export default class ConfirmDeallocationIfExistingRoutes {
  constructor(private readonly activitiesService: ActivityService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const selectedAllocationIds = req.query.allocationIds.toString().split(',')
    const scheduleId = +req.session.allocateJourney.activity.scheduleId
    const allocations = (await this.activitiesService.getAllocations(scheduleId, user)).filter(
      a => selectedAllocationIds.includes(a.id.toString()) && a.plannedDeallocation,
    )
    const selectedPrisonerIds = allocations
      .filter(a => selectedAllocationIds.includes(a.id.toString()))
      .map(a => a.prisonerNumber)
    const selectedPrisoners = req.session.allocateJourney.inmates
      .filter(i => selectedPrisonerIds.includes(i.prisonerNumber))
      .map(i => ({
        prisonerName: i.prisonerName,
        endDate: allocations.find(a => a.prisonerNumber === i.prisonerNumber)?.plannedDeallocation?.plannedDate,
      }))

    res.render('pages/activities/manage-allocations/confirm-deallocation-if-existing', { selectedPrisoners })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirectOrReturn('exclusions')
  }
}
