import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'

enum RequesterEnum {
  PRISONER = 'PRISONER',
  GUIDANCE_STAFF = 'GUIDANCE_STAFF',
  OTHER = 'OTHER',
}

export default class EditRequesterRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render(`pages/activities/waitlist-application/edit-requester`, {
      RequesterEnum,
      prisonerName: req.session.waitListApplicationJourney.prisoner.name,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { requester, otherRequester } = req.body

    let requestedBy
    if (requester === RequesterEnum.OTHER) {
      requestedBy = otherRequester
    } else {
      requestedBy =
        requester === RequesterEnum.PRISONER
          ? 'Self-requested'
          : 'IAG or CXK careers information, advice and guidance staff'
    }

    await this.activitiesService.patchWaitlistApplication(+applicationId, { requestedBy }, user)

    return res.redirectWithSuccess(
      `view`,
      `You have updated the requester of ${req.session.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
