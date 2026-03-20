import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import {
  WaitingListAllocationStatusOptions,
  WaitingListStatusDescriptions,
  WaitingListStatus,
} from '../../../../../enum/waitingListStatus'

export class EditStatus {
  @Expose()
  @IsIn(Object.values(WaitingListAllocationStatusOptions), { message: 'Select a status for the application' })
  status: WaitingListAllocationStatusOptions
}

export default class EditStatusRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const template = 'pages/activities/waitlist-application/edit-status'

    const renderData: Record<string, unknown> = {
      WaitingListStatusDescriptions,
      prisonerName: req.journeyData.waitListApplicationJourney.prisoner.name,
    }

    renderData.WaitingListStatus = WaitingListStatus

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
