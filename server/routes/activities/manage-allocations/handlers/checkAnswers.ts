import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { DeallocationReasonCode } from '../../../../@types/activitiesAPI/types'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const { deallocationReason } = req.session.allocateJourney
    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/manage-allocations/check-answers', {
      deallocationReason: deallocationReasons.find(r => r.code === deallocationReason)?.description,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { inmate, inmates, activity, startDate, endDate, deallocationReason } = req.session.allocateJourney
    const { user } = res.locals

    if (req.params.mode === 'create') {
      await this.activitiesService.allocateToSchedule(
        activity.scheduleId,
        inmate.prisonerNumber,
        inmate.payBand.id,
        user,
        startDate,
        endDate,
      )
    }

    if (req.params.mode === 'remove') {
      await this.activitiesService.deallocateFromActivity(
        activity.scheduleId,
        inmates.map(p => p.prisonerNumber),
        deallocationReason as DeallocationReasonCode,
        endDate,
        user,
      )
    }

    res.redirect('confirmation')
  }
}
