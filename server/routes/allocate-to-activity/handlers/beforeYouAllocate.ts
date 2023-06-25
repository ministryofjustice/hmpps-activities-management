import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'

export class ConfirmOptions {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Please confirm you want to continue with this allocation' })
  confirm: string
}

export default class BeforeYouAllocateRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { prisonerNumber } = req.session.allocateJourney.inmate
    const { scheduleId } = req.session.allocateJourney.activity

    const allocationSuitability = await this.activitiesService.allocationSuitability(scheduleId, prisonerNumber, user)

    res.render('pages/allocate-to-activity/before-you-allocate', { allocationSuitability })
  }

  POST = async (req: Request, res: Response) => {
    const { confirm } = req.body
    const { scheduleId } = req.session.allocateJourney.activity

    if (confirm === 'yes') return res.redirect('start-date')
    return res.redirect(`/activities/allocation-dashboard/${scheduleId}#candidates-tab`)
  }
}
