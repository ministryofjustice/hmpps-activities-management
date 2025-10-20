import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, ValidateIf } from 'class-validator'
import { isPast, isToday, startOfToday } from 'date-fns'
import { DeallocateTodayOption } from '../journey'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import { parseDate } from '../../../../utils/utils'
import Validator from '../../../../validators/validator'

export class DeallocateToday {
  @Expose()
  @IsEnum(DeallocateTodayOption, { message: 'Select when you want this allocation to end' })
  @Transform(({ value }) => DeallocateTodayOption[value])
  deallocateTodayOption: DeallocateTodayOption

  @ValidateIf(o => o.deallocateTodayOption === 'FUTURE_DATE')
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date on or after today's date" })
  endDate: Date
}

export default class DeallocateTodayOptionRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    let nextAllocationToday = false
    const nextAvailableInstance = req.journeyData.allocateJourney.scheduledInstance || null
    if (nextAvailableInstance) {
      const nextSessionDateAndTime = parseDate(
        `${nextAvailableInstance.date}T${nextAvailableInstance.startTime}`,
        "yyyy-MM-dd'T'HH:mm",
      )
      nextAllocationToday = isToday(nextSessionDateAndTime) && !isPast(nextSessionDateAndTime)
    }

    // res.locals.allocateJourney = req.journeyData.allocateJourney
    res.render('pages/activities/manage-allocations/deallocate-today-option', { nextAllocationToday })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocateTodayOption, endDate } = req.body
    req.journeyData.allocateJourney.deallocateTodayOption = deallocateTodayOption

    switch (deallocateTodayOption) {
      case DeallocateTodayOption.TODAY:
      case DeallocateTodayOption.EOD:
        req.journeyData.allocateJourney.endDate = formatIsoDate(new Date())
        break
      case DeallocateTodayOption.FUTURE_DATE:
        req.journeyData.allocateJourney.endDate = formatIsoDate(endDate)
        break
      default:
        break
    }

    if (req.routeContext.mode === 'remove') {
      return res.redirectOrReturn(`reason`)
    }

    if (req.journeyData.allocateJourney.activity.paid) {
      if (req.journeyData.allocateJourney.allocateMultipleInmatesMode) {
        if (req.query.preserveHistory) return res.redirect('multiple/check-answers')
        return res.redirectOrReturn('multiple/pay-band-multiple')
      }
      return res.redirectOrReturn('pay-band')
    }

    if (req.journeyData.allocateJourney.allocateMultipleInmatesMode) {
      return res.redirectOrReturn('multiple/pay-band-multiple')
    }
    return res.redirectOrReturn('exclusions')
  }
}
