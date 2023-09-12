import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested, ValidationArguments } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsBeforeOtherProperty from '../../../../validators/dateIsBeforeOtherProperty'
import { formatDate } from '../../../../utils/utils'
import { ActivityUpdateRequest, Allocation } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import DateIsAfter from '../../../../validators/dateIsAfter'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'
import { CreateAnActivityJourney } from '../journey'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid start date' })
  @IsValidDate({ message: 'Enter a valid start date' })
  @DateIsBeforeOtherProperty('endDate', { message: 'Enter a date before the end date' })
  @DateIsAfter(new Date(), { message: 'Activity start date must be in the future' })
  @DateIsSameOrBefore(o => plainToInstance(SimpleDate, o.createJourney?.startDate)?.toRichDate(), {
    message: (args: ValidationArguments) => {
      const { createJourney } = args.object as { createJourney: CreateAnActivityJourney }
      const allocationStartDate = formatDate(new Date(createJourney.earliestAllocationStartDate), 'dd-MM-yyyy')
      return `Enter a date before the first allocation start date, ${allocationStartDate}`
    },
  })
  startDate: SimpleDate

  @Expose()
  endDate: string
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { session } = req
    const { user } = res.locals
    let allocations: Allocation[]
    if (req.query && req.query.fromEditActivity) {
      const { activityId } = req.session.createJourney
      const schedule = await this.activitiesService.getActivitySchedule(activityId, user)
      if (schedule.allocations.length > 0) {
        allocations = schedule.allocations.sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
        req.session.createJourney.earliestAllocationStartDate = new Date(allocations[0].startDate)
      }
    }
    res.render('pages/activities/create-an-activity/start-date', {
      endDate: session.createJourney.endDate
        ? formatDate(plainToInstance(SimpleDate, session.createJourney.endDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.startDate = req.body.startDate
    if (req.query && req.query.fromEditActivity) {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        startDate: formatDate(
          plainToInstance(SimpleDate, req.session.createJourney.startDate).toRichDate(),
          'yyyy-MM-dd',
        ),
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the start date for ${req.session.createJourney.name}`

      const returnTo = `/activities/schedule/activities/${req.session.createJourney.activityId}`
      req.session.returnTo = returnTo
      res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    } else res.redirectOrReturn(`end-date-option`)
  }
}
