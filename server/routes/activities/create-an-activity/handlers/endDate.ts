import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { startOfToday } from 'date-fns'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import BankHolidayService from '../../../../services/bankHolidayService'
import ActivityDateValidator from '../../../../utils/helpers/activityDateValidator'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import { CreateAnActivityJourney } from '../journey'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import { getNearestInvalidEndDate, isEndDateValid } from '../../../../utils/helpers/activityScheduleValidator'
import { formatDate } from '../../../../utils/utils'

export class EndDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate > startOfToday(), { message: 'Activity end date must be in the future' })
  @Validator(
    (date, { createJourney }) => {
      const allocationDate = createJourney?.latestAllocationStartDate
      return allocationDate ? date >= parseIsoDate(allocationDate) : true
    },
    {
      message: ({ object }) => {
        const { createJourney } = object as { createJourney: CreateAnActivityJourney }
        const allocationStartDate = isoDateToDatePickerDate(createJourney?.latestAllocationStartDate)
        return `Enter a date on or after latest allocation start date, ${allocationStartDate}`
      },
    },
  )
  @Validator((date, { createJourney }) => date >= parseIsoDate(createJourney.startDate), {
    message: ({ object }) => {
      const { createJourney } = object as { createJourney: CreateAnActivityJourney }
      return `Enter a date on or after the activity’s scheduled start date, ${isoDateToDatePickerDate(
        createJourney?.startDate,
      )}`
    },
  })
  @Validator(
    (date, { createJourney, routeContext }) => routeContext.mode === 'edit' || isEndDateValid(createJourney, date),
    {
      message: ({ object }) => {
        const { createJourney } = object as { createJourney: CreateAnActivityJourney }
        const nearestDate = getNearestInvalidEndDate(createJourney)
        return `Enter a date after ${formatDate(nearestDate)}, so the days this activity runs are all before it’s scheduled to end`
      },
    },
  )
  @IsValidDate({ message: 'Enter an end date' })
  endDate: Date
}

export default class EndDateRoutes {
  private readonly helper: ActivityDateValidator

  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly bankHolidayService: BankHolidayService,
  ) {
    this.helper = new ActivityDateValidator(bankHolidayService)
  }

  GET = async (req: Request, res: Response) => res.render('pages/activities/create-an-activity/end-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const updatedEndDate = req.body.endDate

    req.session.createJourney.endDate = updatedEndDate ? formatIsoDate(updatedEndDate) : null
    req.session.createJourney.hasAtLeastOneValidDay = await this.helper.hasAtLeastOneValidDay(
      req.session.createJourney,
      user,
    )

    if (!req.session.createJourney.hasAtLeastOneValidDay) {
      req.session.createJourney.runsOnBankHoliday = true
    }

    if (req.routeContext.mode === 'edit') {
      const { activityId, name, endDate } = req.session.createJourney
      const activity = { endDate, removeEndDate: !endDate } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)
      const successMessage = `You've updated the end date for ${name}. Anyone allocated to the activity who was due to be taken off after this date will now finish on this date.`
      return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }

    return res.redirectOrReturn('schedule-frequency')
  }
}
