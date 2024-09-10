import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, ValidateIf, ValidationArguments } from 'class-validator'
import { startOfToday } from 'date-fns'
import { AllocateToActivityJourney, StartDateOption } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../services/activitiesService'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'

export class StartDate {
  @Expose()
  @IsEnum(StartDateOption, { message: 'Select whether start date is next session or a different date' })
  @Transform(({ value }) => StartDateOption[value])
  startDateOption: StartDateOption

  @Expose()
  @ValidateIf(o => o.startDateOption === StartDateOption.START_DATE)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date > startOfToday(), { message: 'Enter a date in the future' })
  @Validator((date, { allocateJourney }) => date >= parseIsoDate(allocateJourney.activity.startDate), {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const activityStartDate = isoDateToDatePickerDate(allocateJourney.activity.startDate)
      return `Enter a date on or after the activity's start date, ${activityStartDate}`
    },
  })
  @Validator(
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
  @Validator((date, { allocateJourney }) => !allocateJourney.endDate || date <= parseIsoDate(allocateJourney.endDate), {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const allocationEndDate = isoDateToDatePickerDate(allocateJourney.endDate)
      return `Enter a date on or before the allocation end date, ${allocationEndDate}`
    },
  })
  @IsValidDate({ message: 'Enter a valid start date' })
  startDate: Date
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/manage-allocations/start-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params
    const { startDateOption } = req.body

    const nextAvailableInstance = req.session.allocateJourney.scheduledInstance

    const startDate =
      startDateOption === StartDateOption.NEXT_SESSION ? nextAvailableInstance?.date : formatIsoDate(req.body.startDate)

    req.session.allocateJourney.startDateOption = startDateOption
    req.session.allocateJourney.startDate = startDate
    req.session.allocateJourney.latestAllocationStartDate = startDate

    if (req.params.mode === 'edit') {
      const allocationUpdate = {
        startDate,
        scheduleInstanceId: startDateOption === StartDateOption.NEXT_SESSION ? nextAvailableInstance?.id : null,
      }

      await this.activitiesService.updateAllocation(+allocationId, allocationUpdate, user)

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
