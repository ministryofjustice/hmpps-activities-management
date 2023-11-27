import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { ValidationArguments } from 'class-validator'
import { startOfToday } from 'date-fns'
import { AllocateToActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'
import ActivitiesService from '../../../../services/activitiesService'
import IsValidDate from '../../../../validators/isValidDate'

export class StartDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @DateValidator(date => date > startOfToday(), { message: "Enter a date after today's date" })
  @DateValidator((date, { allocateJourney }) => date >= parseIsoDate(allocateJourney.activity.startDate), {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const activityStartDate = isoDateToDatePickerDate(allocateJourney.activity.startDate)
      return `Enter a date on or after the activity's start date, ${activityStartDate}`
    },
  })
  @DateValidator(
    (date, { allocateJourney }) => {
      return !allocateJourney.activity.endDate || date <= parseIsoDate(allocateJourney.activity.endDate)
    },
    {
      message: (args: ValidationArguments) => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const activityEndDate = isoDateToDatePickerDate(allocateJourney.activity.endDate)
        return `Enter a date on or before the activity's end date, ${activityEndDate}`
      },
    },
  )
  @DateValidator(
    (date, { allocateJourney }) => !allocateJourney.endDate || date <= parseIsoDate(allocateJourney.endDate),
    {
      message: (args: ValidationArguments) => {
        const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
        const allocationEndDate = isoDateToDatePickerDate(allocateJourney.endDate)
        return `Enter a date on or before the allocation end date, ${allocationEndDate}`
      },
    },
  )
  @IsValidDate({ message: 'Enter a valid start date' })
  startDate: Date
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/manage-allocations/start-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params

    req.session.allocateJourney.startDate = formatIsoDate(req.body.startDate)
    req.session.allocateJourney.latestAllocationStartDate = formatIsoDate(req.body.startDate)

    if (req.params.mode === 'edit') {
      const allocationUpdate = { startDate: formatIsoDate(req.body.startDate) }
      await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocationUpdate)

      const successMessage = `You've updated the start date for this allocation`
      return res.redirectWithSuccess(
        `/activities/allocations/view/${allocationId}`,
        'Allocation updated',
        successMessage,
      )
    }
    return res.redirectOrReturn(`end-date-option`)
  }
}
