import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { DeallocateTodayOption } from '../journey'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

export class DeallocateToday {
  @Expose()
  @IsEnum(DeallocateTodayOption, { message: 'Select whether the allocation should end today or in the future' })
  @Transform(({ value }) => DeallocateTodayOption[value])
  deallocateTodayOption: DeallocateTodayOption
}

export default class DeallocateTodayOptionRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/manage-allocations/deallocate-today-option')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocateTodayOption } = req.body
    req.session.allocateJourney.deallocateTodayOption = deallocateTodayOption
    if (deallocateTodayOption === DeallocateTodayOption.TODAY) {
      req.session.allocateJourney.endDate = formatIsoDate(new Date())
      return res.redirect('reason')
    }
    return res.redirect('end-date')
  }
}
