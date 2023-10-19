import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsDate } from 'class-validator'
import { parseISO, startOfDay } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import { formatDatePickerDate, formatIsoDate, parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import DateValidator from '../../../../../validators/DateValidator'
import { WaitListApplicationJourney } from '../../journey'

export class EditRequestDate {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsDate({ message: 'Enter a valid request date' })
  @DateValidator(
    (date, { waitListApplicationJourney }) => date <= startOfDay(parseISO(waitListApplicationJourney.createdTime)),
    {
      message: ({ object }) => {
        const { waitListApplicationJourney } = object as { waitListApplicationJourney: WaitListApplicationJourney }
        const createdTime = formatDatePickerDate(parseISO(waitListApplicationJourney?.createdTime))
        return `The date cannot be after the date that the application was originally recorded, ${createdTime}`
      },
    },
  )
  requestDate: Date
}

export default class EditRequestDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/waitlist-application/edit-request-date')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { requestDate } = req.body
    const { prisoner } = req.session.waitListApplicationJourney

    const updatedApplication = { applicationDate: formatIsoDate(requestDate) }
    await this.activitiesService.patchWaitlistApplication(+applicationId, updatedApplication, user)

    res.redirectWithSuccess('view', `You have updated the date of request of ${prisoner.name}'s application`)
  }
}
