import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import DateIsBeforeOtherProperty from '../../../../validators/dateIsBeforeOtherProperty'
import { formatDate } from '../../../../utils/utils'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid start date' })
  @IsValidDate({ message: 'Enter a valid start date' })
  @DateIsSameOrAfter(new Date(), { message: "Enter a date on or after today's date" })
  @DateIsBeforeOtherProperty('endDate', { message: 'Enter a date before the end date' })
  startDate: SimpleDate

  @Expose()
  endDate: string
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { session } = req
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
