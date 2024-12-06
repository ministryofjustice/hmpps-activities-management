import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import { isoDateToDatePickerDate, parseDatePickerDate, parseIsoDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import { SuspendJourney } from '../journey'
import { toDateString } from '../../../../utils/utils'
import Validator from '../../../../validators/validator'
import config from '../../../../config'
import { PrisonPayBand } from '../../../../@types/activitiesAPI/types'

enum PresetDateOptions {
  IMMEDIATELY = 'immediately',
  TOMORROW = 'tomorrow',
  OTHER = 'other',
}

export class SuspendFrom {
  @Expose()
  @Validator(
    (datePresetOption, { suspendJourney }) =>
      datePresetOption !== PresetDateOptions.TOMORROW ||
      !suspendJourney.earliestAllocationEndDate ||
      new Date(suspendJourney.earliestAllocationEndDate) > new Date(),
    {
      message: args => {
        const { suspendJourney } = args.object as { suspendJourney: SuspendJourney }
        return `Suspension must start on or before the allocation end date ${isoDateToDatePickerDate(suspendJourney.earliestAllocationEndDate)}`
      },
    },
  )
  @IsIn(Object.values(PresetDateOptions), { message: 'Select a date' })
  datePresetOption: string

  @Expose()
  @ValidateIf(o => o.datePresetOption === PresetDateOptions.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(
    (date, { suspendJourney }) =>
      !suspendJourney.earliestAllocationEndDate || date <= parseIsoDate(suspendJourney.earliestAllocationEndDate),
    {
      message: args => {
        const { suspendJourney } = args.object as { suspendJourney: SuspendJourney }
        const { earliestAllocationEndDate } = suspendJourney
        return `Enter a date on or before the allocation end date, ${isoDateToDatePickerDate(earliestAllocationEndDate)}`
      },
    },
  )
  @Validator(date => date >= startOfToday(), { message: "Enter a date on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date
}

export default class SuspendFromRoutes {
  GET = async (req: Request, res: Response) => res.render('pages/activities/suspensions/suspend-from')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { datePresetOption, date } = req.body
    req.session.suspendJourney.suspendFrom = toDateString(this.dateFromOptions(datePresetOption, date))

    if (config.suspendPrisonerWithPayToggleEnabled) {
      const allocationHasPayRate = this.activityHasPayBand(req.session.suspendJourney.allocations)
      if (allocationHasPayRate) return res.redirectOrReturn('pay')
      req.session.suspendJourney.toBePaid = null
    }
    return res.redirectOrReturn('case-note-question')
  }

  private dateFromOptions = (dateOption: PresetDateOptions, date: Date) => {
    const today = new Date()
    switch (dateOption) {
      case PresetDateOptions.IMMEDIATELY:
        return today
      case PresetDateOptions.TOMORROW:
        return addDays(today, 1)
      case PresetDateOptions.OTHER:
        return date
      default:
        throw new Error('No suitable date found')
    }
  }

  private activityHasPayBand = (
    allocations: {
      activityId: number
      allocationId: number
      activityName: string
      payBand: PrisonPayBand
    }[],
  ): boolean => {
    if (allocations?.length > 1) {
      return !!allocations.filter(al => al.payBand).length
    }
    return !!allocations[0].payBand
  }
}
