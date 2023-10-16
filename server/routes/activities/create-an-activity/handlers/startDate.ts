import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate } from 'class-validator'
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
import DateValidator from '../../../../validators/DateValidator'

export class StartDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid start date' })
  @DateValidator(thisDate => thisDate > startOfToday(), { message: 'Activity start date must be in the future' })
  @DateValidator(
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
  @DateValidator((date, { createJourney }) => !createJourney?.endDate || date < parseIsoDate(createJourney.endDate), {
    message: 'Enter a date before the activity end date',
  })
  startDate: Date
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/create-an-activity/start-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.startDate = formatIsoDate(req.body.startDate)
    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId, name, startDate } = req.session.createJourney
      const activity = { startDate } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)

      const successMessage = `We've updated the start date for ${name}`
      res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    } else res.redirectOrReturn(`end-date-option`)
  }
}
