import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate, ValidateIf } from 'class-validator'
import { startOfToday } from 'date-fns'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import {
  formatIsoDate,
  isoDateToDatePickerDate,
  parseDatePickerDate,
  parseIsoDate,
} from '../../../../utils/datePickerUtils'
import DateValidator from '../../../../validators/DateValidator'
import { CreateAnActivityJourney } from '../journey'

export class EndDate {
  endDateString: string

  @Expose()
  @Transform(({ obj }) => parseDatePickerDate(obj.endDateString))
  @ValidateIf(o => o.endDateString !== '')
  @IsDate({ message: 'Enter a valid end date' })
  @DateValidator(thisDate => thisDate > startOfToday(), { message: 'Activity end date must be in the future' })
  @DateValidator(
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
  @DateValidator((date, { createJourney }) => date >= parseIsoDate(createJourney.startDate), {
    message: ({ object }) => {
      const { createJourney } = object as { createJourney: CreateAnActivityJourney }
      return `Enter a date on or after the activity start date, ${isoDateToDatePickerDate(createJourney?.startDate)}`
    },
  })
  endDate: Date
}

export default class EndDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/create-an-activity/end-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const updatedEndDate = req.body.endDate
    req.session.createJourney.endDate = updatedEndDate ? formatIsoDate(updatedEndDate) : null
    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId, name, endDate } = req.session.createJourney
      const activity = { endDate, removeEndDate: !endDate } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(user.activeCaseLoadId, activityId, activity)

      const successMessage = `We've updated the end date for ${name}`
      res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
    } else res.redirectOrReturn('schedule-frequency')
  }
}
