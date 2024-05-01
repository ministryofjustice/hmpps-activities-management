import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { startOfToday } from 'date-fns'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import { CreateAnActivityJourney } from '../journey'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import { getNearestInvalidStartDate, isStartDateValid } from '../../../../utils/helpers/activityScheduleValidator'
import { formatDate } from '../../../../utils/utils'

export class StartDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate > startOfToday(), { message: 'Enter a date in the future' })
  @Validator(
    (date, { createJourney }) => {
      const allocationDate = createJourney?.earliestAllocationStartDate
      return !allocationDate || date <= parseIsoDate(allocationDate)
    },
    {
      message: ({ object }) => {
        const { createJourney } = object as { createJourney: CreateAnActivityJourney }
        const allocationStartDate = isoDateToDatePickerDate(createJourney?.earliestAllocationStartDate)
        return `Enter a date on or before the first allocation start date, ${allocationStartDate}`
      },
    },
  )
  @Validator((date, { createJourney }) => !createJourney?.endDate || date <= parseIsoDate(createJourney.endDate), {
    message: ({ object }) => {
      const { createJourney } = object as { createJourney: CreateAnActivityJourney }
      const activityEndDate = isoDateToDatePickerDate(createJourney?.endDate)
      return `Enter a date on or before the activity’s scheduled end date, ${activityEndDate}`
    },
  })
  @Validator((date, { createJourney }) => isStartDateValid(createJourney, date), {
    message: ({ object }) => {
      const { createJourney } = object as { createJourney: CreateAnActivityJourney }
      const nearestDate = getNearestInvalidStartDate(createJourney)
      return `Enter a date before ${formatDate(nearestDate)}, so the days this activity runs are all before it’s scheduled to end.`
    },
  })
  @IsValidDate({ message: 'Enter a valid start date' })
  startDate: Date
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/create-an-activity/start-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const updatedStartDate = req.body.startDate

    req.session.createJourney.startDate = formatIsoDate(updatedStartDate)

    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId, name, startDate } = req.session.createJourney
      const activity = { startDate } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(activityId, activity, user)

      const successMessage = `You've updated the start date for ${name}`
      return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    }

    return res.redirectOrReturn(`end-date-option`)
  }
}
