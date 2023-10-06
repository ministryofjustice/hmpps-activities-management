import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { ValidateIf, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import { formatDate } from '../../../../utils/utils'
import { ActivityUpdateRequest, Allocation } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import DateIsSameOrAfterOtherProperty from '../../../../validators/dateIsSameOrAfterOtherProperty'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateIf(o => !o.endDate.isEmpty())
  @ValidateNested()
  @DateIsSameOrAfterOtherProperty('startDate', {
    message: 'Enter a date on or after the activity start date and latest allocation start date',
  })
  @DateIsSameOrAfter(o => o.createJourney.latestAllocationStartDate, {
    message: 'Enter a date on or after the activity start date and latest allocation start date',
  })
  @IsValidDate({ message: 'Enter a valid end date' })
  endDate: SimpleDate

  @Expose()
  startDate: string
}

export default class EndDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { session } = req
    const { user } = res.locals
    let allocations: Allocation[]
    if (req.params.mode === 'edit') {
      const { scheduleId } = req.session.createJourney
      const schedule = await this.activitiesService.getActivitySchedule(scheduleId, user)
      if (schedule.allocations.length > 0) {
        allocations = schedule.allocations.sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
        req.session.createJourney.latestAllocationStartDate = new Date(allocations[allocations.length - 1].startDate)
      }
    } else {
      req.session.createJourney.latestAllocationStartDate = plainToInstance(
        SimpleDate,
        req.session.createJourney.startDate,
      ).toRichDate()
    }
    res.render('pages/activities/create-an-activity/end-date', {
      startDate: session.createJourney.startDate
        ? formatDate(plainToInstance(SimpleDate, session.createJourney.startDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.endDate = req.body.endDate.isEmpty() ? undefined : req.body.endDate
    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        endDate: req.body.endDate.isEmpty()
          ? null
          : formatDate(plainToInstance(SimpleDate, req.session.createJourney.endDate).toRichDate(), 'yyyy-MM-dd'),
        removeEndDate: req.body.endDate.isEmpty(),
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the end date for ${req.session.createJourney.name}`

      const returnTo = `/activities/view/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else res.redirectOrReturn('schedule-frequency')
  }
}
