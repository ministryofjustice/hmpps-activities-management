import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, ValidateIf } from 'class-validator'
import { isPast, isToday, startOfTomorrow } from 'date-fns'
import { AllocateToActivityJourney, DeallocateAfterAllocationDateOption } from '../../journey'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import { parseDate } from '../../../../../utils/utils'
import IsValidDate from '../../../../../validators/isValidDate'
import Validator from '../../../../../validators/validator'
import ActivitiesService from '../../../../../services/activitiesService'
import logger from '../../../../../../logger'

export class DeallocateDate {
  @Expose()
  @IsEnum(DeallocateAfterAllocationDateOption, {
    message: ({ object }) => {
      const { allocateJourney } = object as { allocateJourney: AllocateToActivityJourney }
      const removedFromText = allocateJourney.activitiesToDeallocate?.length
        ? `${allocateJourney.activitiesToDeallocate.length} activities`
        : allocateJourney.activity.name
      return `Select when you want ${allocateJourney.inmate.prisonerName} to be taken off ${removedFromText}`
    },
  })
  @Transform(({ value }) => DeallocateAfterAllocationDateOption[value])
  deallocationAfterAllocationDate: DeallocateAfterAllocationDateOption

  @Expose()
  @ValidateIf(o => o.deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.FUTURE_DATE)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfTomorrow(), { message: 'Enter a date that’s in the future' })
  @IsNotEmpty({ message: 'Enter a date' })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date
}

export default class DeallocationDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { allocateJourney } = req.journeyData
    if (allocateJourney.activitiesToDeallocate) {
      // multiple
      const ids = allocateJourney.activitiesToDeallocate.map(act => act.activityId)
      const schIds = allocateJourney.activitiesToDeallocate.map(act => act.scheduleId)
      logger.info(
        `Deallocation date page for ${allocateJourney.inmate.prisonerNumber}. Activities to deallocate: ${ids}, scheduleIds: ${schIds}, next scheduled instance: ${allocateJourney.scheduledInstance.id}, ${allocateJourney.scheduledInstance.date}, ${allocateJourney.scheduledInstance.timeSlot}`,
      )
    } else {
      // single
      logger.info(
        `Deallocation date page for ${allocateJourney.inmate.prisonerNumber}. Activity to deallocate: ${allocateJourney.activity.activityId}, scheduleId: ${allocateJourney.activity.scheduleId}, next scheduled instance: ${allocateJourney.scheduledInstance.id}, ${allocateJourney.scheduledInstance.date}, ${allocateJourney.scheduledInstance.timeSlot}`,
      )
    }

    const nextAvailableInstance = allocateJourney.scheduledInstance

    const nextSessionDateAndTime = parseDate(
      `${nextAvailableInstance.date}T${nextAvailableInstance.startTime}`,
      "yyyy-MM-dd'T'HH:mm",
    )
    let showImmediateDeallocationOption = false
    if (isToday(nextSessionDateAndTime) && !isPast(nextSessionDateAndTime)) {
      showImmediateDeallocationOption = true
    }

    res.render('pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-date', {
      showImmediateDeallocationOption,
      multipleActivitiesToRemove: allocateJourney.activitiesToDeallocate?.length && !allocateJourney.activity,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { deallocationAfterAllocationDate, date } = req.body
    const { activity, activitiesToDeallocate } = req.journeyData.allocateJourney

    let notInWork = null
    if (!activitiesToDeallocate?.length && activity) {
      const allocations = await this.activitiesService.getAllocations(activity.scheduleId, user)
      const [allocation] = allocations.filter(a => a.activityId === activity.activityId)
      notInWork = allocation.isUnemployment
    }

    if (
      deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.TODAY ||
      deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.NOW
    ) {
      req.journeyData.allocateJourney.endDate = formatIsoDate(new Date())
    } else {
      req.journeyData.allocateJourney.endDate = formatIsoDate(date)
    }

    req.journeyData.allocateJourney.deallocateAfterAllocationDateOption = deallocationAfterAllocationDate
    if (activity) activity.notInWork = notInWork

    if (notInWork) {
      return res.redirect('deallocation-check-and-confirm')
    }
    return res.redirect('reason')
  }
}
