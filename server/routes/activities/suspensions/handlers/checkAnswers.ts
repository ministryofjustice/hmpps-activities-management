import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { AddCaseNoteRequest } from '../../../../@types/activitiesAPI/types'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/suspensions/check-answers')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { allocations, suspendFrom, suspendUntil, caseNote } = req.session.suspendJourney
    const { user } = res.locals
    const { mode, prisonerNumber } = req.params

    const allocationIds = allocations.map(a => a.allocationId)

    if (mode === 'suspend') {
      await this.activitiesService.suspendAllocations(
        prisonerNumber,
        allocationIds,
        suspendFrom,
        caseNote as AddCaseNoteRequest,
        'SUSPENDED',
        user,
      )
    }

    if (mode === 'unsuspend') {
      await this.activitiesService.unsuspendAllocations(prisonerNumber, allocationIds, suspendUntil, user)
    }

    return res.redirect('confirmation')
  }
}
