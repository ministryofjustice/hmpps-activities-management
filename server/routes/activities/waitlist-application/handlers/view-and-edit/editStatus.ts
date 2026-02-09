import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import {
  WaitingListStatusOptions,
  WaitingListStatusWithWithdrawn,
  WaitingListStatusDescriptions,
  WaitingListStatus,
} from '../../../../../enum/waitingListStatus'
import config from '../../../../../config'

export class EditStatus {
  @Expose()
  @IsIn(Object.values(WaitingListStatusOptions), { message: 'Select a status for the application' })
  status: WaitingListStatusOptions
}

export default class EditStatusRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { waitlistWithdrawnEnabled } = config

    const template = waitlistWithdrawnEnabled
      ? 'pages/activities/waitlist-application/edit-status-with-withdrawn'
      : 'pages/activities/waitlist-application/edit-status'

    const renderData: Record<string, unknown> = {
      WaitingListStatusDescriptions,
      prisonerName: req.journeyData.waitListApplicationJourney.prisoner.name,
      waitlistWithdrawnEnabled,
    }

    if (waitlistWithdrawnEnabled) {
      renderData.WaitingListStatusWithWithdrawn = WaitingListStatusWithWithdrawn
    } else {
      renderData.WaitingListStatus = WaitingListStatus
    }

    res.render(template, renderData)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.params
    const { user } = res.locals
    const { status } = req.body

    await this.activitiesService.patchWaitlistApplication(+applicationId, { status }, user)

    return res.redirectWithSuccess(
      `view`,
      `You have updated the status of ${req.journeyData.waitListApplicationJourney.prisoner.name}'s application`,
    )
  }
}
