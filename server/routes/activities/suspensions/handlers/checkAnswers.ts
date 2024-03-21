import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { AddCaseNoteRequest } from '../../../../@types/activitiesAPI/types'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/suspensions/check-answers')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { allocations, suspendFrom, suspendUntil, caseNote } = req.session.suspendJourney
    const { user } = res.locals
    const { mode } = req.params

    if (mode === 'suspend') {
      await Promise.all(
        allocations.map(a =>
          this.activitiesService.updateAllocation(
            a.allocationId,
            {
              suspendFrom,
              suspensionCaseNote: caseNote as AddCaseNoteRequest,
            },
            user,
          ),
        ),
      )
    }

    if (mode === 'unsuspend') {
      await Promise.all(
        allocations.map(a => this.activitiesService.updateAllocation(a.allocationId, { suspendUntil }, user)),
      )
    }

    return res.redirect('confirmation')
  }
}
