import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, ValidateIf } from 'class-validator'
import { isPast, isToday, startOfTomorrow } from 'date-fns'
import { DeallocateAfterAllocationDateOption } from '../../journey'
import { formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import { parseDate } from '../../../../../utils/utils'
import IsValidDate from '../../../../../validators/isValidDate'
import Validator from '../../../../../validators/validator'
import ActivitiesService from '../../../../../services/activitiesService'

export class DeallocateDate {
  @Expose()
  @IsEnum(DeallocateAfterAllocationDateOption, {
    message: 'Select when you want them to be taken off Unemployed',
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
    const { allocateJourney } = req.session
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
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { deallocationAfterAllocationDate, date } = req.body
    const { activity } = req.session.allocateJourney

    const allocation = await this.activitiesService.getAllocations(activity.scheduleId, user)
    const { isUnemployment } = allocation.filter(a => a.activityId === activity.activityId)[0]

    if (
      deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.TODAY ||
      deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.NOW
    ) {
      req.session.allocateJourney.endDate = formatIsoDate(new Date())
    } else {
      req.session.allocateJourney.endDate = formatIsoDate(date)
    }
    console.log(req.session.allocateJourney)
    req.session.allocateJourney.deallocateAfterAllocationDateOption = deallocationAfterAllocationDate

    if (isUnemployment) {
      return res.redirect('deallocation-check-and-confirm?notInWorkActivity=true')
    }
    return res.redirect('reason-for-deallocation')
  }
}
