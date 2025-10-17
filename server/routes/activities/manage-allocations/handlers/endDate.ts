import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { isPast, isToday, startOfToday } from 'date-fns'
import { AllocateToActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import { parseDate } from '../../../../utils/utils'

export class EndDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date on or after today's date" })
  @Validator((date, { allocateJourney }) => date >= parseIsoDate(allocateJourney.latestAllocationStartDate), {
    message: args => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const { latestAllocationStartDate } = allocateJourney
      return `Enter a date on or after the allocation start date, ${isoDateToDatePickerDate(latestAllocationStartDate)}`
    },
  })
  @Validator(
    (date, { allocateJourney }) => {
      return date >= parseIsoDate(allocateJourney.activity.startDate)
    },
    {
      message: args => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const { startDate } = allocateJourney.activity
        return `Enter a date on or after the activity's start date, ${isoDateToDatePickerDate(startDate)}`
      },
    },
  )
  @Validator(
    (date, { allocateJourney }) => {
      return !allocateJourney.activity.endDate || date <= parseIsoDate(allocateJourney?.activity?.endDate)
    },
    {
      message: args => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const { endDate } = allocateJourney.activity
        return `Enter a date on or before the activity's end date, ${isoDateToDatePickerDate(endDate)}`
      },
    },
  )
  @IsValidDate({ message: 'Enter a valid end date' })
  endDate: Date
}

export default class EndDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { allocateJourney } = req.journeyData
    const nextAvailableInstance = allocateJourney.scheduledInstance || null
    res.locals.allocateJourney = req.journeyData.allocateJourney

    if (nextAvailableInstance) {
      const nextSessionDateAndTime = parseDate(
        `${nextAvailableInstance.date}T${nextAvailableInstance.startTime}`,
        "yyyy-MM-dd'T'HH:mm",
      )

      if (
        req.routeContext.mode === 'remove' &&
        allocateJourney.inmates.length === 1 &&
        isToday(nextSessionDateAndTime) &&
        !isPast(nextSessionDateAndTime) &&
        !allocateJourney.deallocateTodayOption
      ) {
        return res.redirect('deallocate-today-option')
      }
    }

    return res.render('pages/activities/manage-allocations/end-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.allocateJourney.endDate = formatIsoDate(req.body.endDate)
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
