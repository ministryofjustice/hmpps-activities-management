import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { isPast, isToday } from 'date-fns'
import { DeallocateAfterAllocationDateOption } from '../../journey'
import { formatIsoDate } from '../../../../../utils/datePickerUtils'
import { parseDate } from '../../../../../utils/utils'

export class DeallocateDate {
  @Expose()
  @IsEnum(DeallocateAfterAllocationDateOption, {
    message: 'Select whether the allocation should end immediately, at the end of today or on a different day',
  })
  @Transform(({ value }) => DeallocateAfterAllocationDateOption[value])
  deallocateAfterAllocationDateOption: DeallocateAfterAllocationDateOption
}

export default class DeallocationDateRoutes {
  constructor() {}

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
      showImmediateDeallocationOption
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationAfterAllocationDate, date } = req.body
    if (
      deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.TODAY_END ||
      deallocationAfterAllocationDate === DeallocateAfterAllocationDateOption.NOW
    ) {
      req.session.allocateJourney.deallocationAfterAllocation.deallocationDate = formatIsoDate(new Date())
    } else {
      req.session.allocateJourney.deallocationAfterAllocation.deallocationDate = formatIsoDate(date)
    }
    return res.redirect('check-and-confirm')
  }
}
