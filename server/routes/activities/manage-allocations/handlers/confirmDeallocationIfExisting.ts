import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { startOfToday } from 'date-fns'
import ActivityService from '../../../../services/activitiesService'
import { parseIsoDate } from '../../../../utils/datePickerUtils'
import { getAllocationStartDateFromActivity } from '../../../../utils/utils'

export class ConfirmDeallocateOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select if you want to change the end date or leave it as it is' })
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
    const { choice } = req.body
    const { activityId, scheduleId } = req.session.allocateJourney.activity
    const { deallocationAfterAllocation } = req.query
    const selectedAllocationIds = req.query.allocationIds.toString().split(',')
    const activity = await this.activitiesService.getActivity(+activityId, res.locals.user)
    req.session.returnTo = null

    if (choice === 'no') {
      req.session.allocateJourney = null
      if (deallocationAfterAllocation || !activity) return res.redirect(`/activities/allocation-dashboard`)
      return res.redirect(`/activities/allocation-dashboard/${activity.id}`)
    }

    if (
      selectedAllocationIds.length === 1 &&
      parseIsoDate(getAllocationStartDateFromActivity(activity, +selectedAllocationIds[0])) > startOfToday()
    ) {
      return res.redirect(
        `/activities/allocations/remove/end-decision?allocationIds=${selectedAllocationIds}&scheduleId=${scheduleId}`,
      )
    }
    return res.redirect(
      `/activities/allocations/remove/deallocate-today-option?allocationIds=${selectedAllocationIds}&scheduleId=${scheduleId}`,
    )
  }
}
