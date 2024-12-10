import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { AddCaseNoteRequest } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { PrisonerSuspensionStatus } from '../../manage-allocations/journey'

export default class CheckAnswersRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/suspensions/check-answers')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { allocations, suspendFrom, suspendUntil, caseNote, paid } = req.session.suspendJourney
    const { user } = res.locals
    const { mode, prisonerNumber } = req.params

    const allocationIds = allocations.map(a => a.allocationId)
    const prisonerSuspensionStatus =
      paid === YesNo.YES ? PrisonerSuspensionStatus.SUSPENDED_WITH_PAY : PrisonerSuspensionStatus.SUSPENDED

    if (mode === 'suspend') {
      await this.activitiesService.suspendAllocations(
        prisonerNumber,
        allocationIds,
        suspendFrom,
        prisonerSuspensionStatus,
        caseNote as AddCaseNoteRequest,
        user,
      )
    }

    if (mode === 'unsuspend') {
      await this.activitiesService.unsuspendAllocations(prisonerNumber, allocationIds, suspendUntil, user)
    }

    return res.redirect('confirmation')
  }
}
