import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { addDays, isPast, isToday } from 'date-fns'
import { DeallocateTodayOption } from '../journey'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import config from '../../../../config'
import { parseDate } from '../../../../utils/utils'

export class DeallocateToday {
  @Expose()
  @IsEnum(DeallocateTodayOption, { message: 'Select when you want this allocation to end' })
  @Transform(({ value }) => DeallocateTodayOption[value])
  deallocateTodayOption: DeallocateTodayOption

  @Transform(({ value }) => parseDatePickerDate(value))
  endDate: Date
}

export default class DeallocateTodayOptionRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    let nextAllocationToday = false
    const nextAvailableInstance = req.session.allocateJourney.scheduledInstance || null
    if (nextAvailableInstance) {
      const nextSessionDateAndTime = parseDate(
        `${nextAvailableInstance.date}T${nextAvailableInstance.startTime}`,
        "yyyy-MM-dd'T'HH:mm",
      )
      nextAllocationToday = isToday(nextSessionDateAndTime) && !isPast(nextSessionDateAndTime)
    }

    res.render('pages/activities/manage-allocations/deallocate-today-option', { nextAllocationToday })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocateTodayOption, endDate } = req.body
    req.session.allocateJourney.deallocateTodayOption = deallocateTodayOption

    switch (deallocateTodayOption) {
      case DeallocateTodayOption.EOD:
        req.session.allocateJourney.endDate = formatIsoDate(addDays(new Date(), 1))
        break
      case DeallocateTodayOption.TODAY:
        req.session.allocateJourney.endDate = formatIsoDate(new Date())
        break
      case DeallocateTodayOption.FUTURE_DATE:
        req.session.allocateJourney.endDate = formatIsoDate(endDate)
        break
      default:
        break
    }

    if (req.routeContext.mode === 'remove') {
      return res.redirectOrReturn(`reason`)
    }

    if (req.session.allocateJourney.activity.paid) {
      if (req.session.allocateJourney.allocateMultipleInmatesMode && config.multiplePrisonerActivityAllocationEnabled) {
        if (req.query.preserveHistory) return res.redirect('multiple/check-answers')
        return res.redirectOrReturn('multiple/pay-band-multiple')
      }
      return res.redirectOrReturn('pay-band')
    }

    if (req.session.allocateJourney.allocateMultipleInmatesMode && config.multiplePrisonerActivityAllocationEnabled) {
      return res.redirectOrReturn('multiple/pay-band-multiple')
    }
    return res.redirectOrReturn('exclusions')
  }
}
