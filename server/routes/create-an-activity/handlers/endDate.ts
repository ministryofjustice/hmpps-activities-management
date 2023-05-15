import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate from '../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../validators/isValidDate'
import DateIsAfterOtherProperty from '../../../validators/dateIsAfterOtherProperty'
import { formatDate } from '../../../utils/utils'
import { ActivityUpdateRequest } from '../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../services/activitiesService'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid end date' })
  @IsValidDate({ message: 'Enter a valid end date' })
  @DateIsAfterOtherProperty('startDate', { message: 'Enter a date after the start date' })
  endDate: SimpleDate

  @Expose()
  startDate: string
}

export default class EndDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { session } = req
    res.render('pages/create-an-activity/end-date', {
      startDate: session.createJourney.startDate
        ? formatDate(plainToInstance(SimpleDate, session.createJourney.startDate).toRichDate(), 'yyyy-MM-dd')
        : undefined,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.endDate = req.body.endDate
    if (req.query && req.query.fromEditActivity) {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const prisonCode = user.activeCaseLoadId
      const activity = {
        endDate: formatDate(plainToInstance(SimpleDate, req.session.createJourney.endDate).toRichDate(), 'yyyy-MM-dd'),
      } as ActivityUpdateRequest
      await this.activitiesService.updateActivity(prisonCode, activityId, activity)
      const successMessage = `We've updated the end date for ${req.session.createJourney.name}`

      res.redirectOrReturnWithSuccess(
        `/schedule/activities/${req.session.createJourney.activityId}`,
        'Activity updated',
        successMessage,
      )
    }
    res.redirectOrReturn(`days-and-times`)
  }
}
