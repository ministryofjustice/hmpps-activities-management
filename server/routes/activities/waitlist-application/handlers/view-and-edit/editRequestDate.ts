import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import IsValidDate from '../../../../../validators/isValidDate'
import DateIsSameOrBefore from '../../../../../validators/dateIsSameOrBefore'
import ActivitiesService from '../../../../../services/activitiesService'
import { formatDate } from '../../../../../utils/utils'
import SimpleDate from '../../../../../commonValidationTypes/simpleDate'

export class EditRequestDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrBefore(o => o.waitListApplicationJourney.createdTime, {
    message: 'The date cannot be after the date that the application was originally recorded',
  })
  @IsValidDate({ message: 'Enter a valid request date' })
  requestDate: SimpleDate
}

export default class EditRequestDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/edit-request-date`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { requestDate } = req.body

    await this.activitiesService.patchWaitlistApplication(
      +applicationId,
      {
        applicationDate: formatDate(plainToInstance(SimpleDate, requestDate as SimpleDate).toString(), 'yyyy-MM-dd'),
      },
      user,
    )

    return res.redirectWithSuccess(
      `view`,
      `You have updated the date of request of ${req.session.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
