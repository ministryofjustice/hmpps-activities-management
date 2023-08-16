import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'

enum StatusEnum {
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
}

export class EditStatus {
  @Expose()
  @IsIn(Object.values(StatusEnum), { message: 'Select a status for the application' })
  status: StatusEnum
}

export default class EditStatusRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/edit-status`, { StatusEnum })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { status } = req.body

    await this.activitiesService.patchWaitlistApplication(+applicationId, { status }, user)

    return res.redirectWithSuccess(
      `view`,
      `You have updated the status of ${req.session.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
