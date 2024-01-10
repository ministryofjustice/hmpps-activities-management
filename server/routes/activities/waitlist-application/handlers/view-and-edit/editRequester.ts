import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import WaitlistRequester from '../../../../../enum/waitlistRequester'

export default class EditRequesterRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/edit-requester`, {
      prisonerName: req.session.waitListApplicationJourney.prisoner.name,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { requester, otherRequester } = req.body

    const requestedBy = requester !== WaitlistRequester.SOMEONE_ELSE.code ? requester : otherRequester

    await this.activitiesService.patchWaitlistApplication(+applicationId, { requestedBy }, user)

    return res.redirectWithSuccess(
      `view`,
      `You have updated the requester of ${req.session.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
