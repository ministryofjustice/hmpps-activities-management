import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

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

    const [allocationSuitability, prisonerAllocations] = await Promise.all([
      this.activitiesService.allocationSuitability(scheduleId, prisonerNumber, user),
      this.activitiesService.getActivePrisonPrisonerAllocations([prisonerNumber], user).then(a => a[0]?.allocations),
    ])

    res.render('pages/allocate-to-activity/before-you-allocate', { allocationSuitability, prisonerAllocations })
  }

  POST = async (req: Request, res: Response) => {
    const { confirm } = req.body
    const { scheduleId } = req.session.allocateJourney.activity

    if (confirm == 'yes') return res.redirect('pay-band')
    else return res.redirect(`/allocation-dashboard/${scheduleId}`)
  }
}
