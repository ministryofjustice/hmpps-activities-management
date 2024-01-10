import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class DeallocationReason {
  @Expose()
  @IsNotEmpty({ message: 'Select a reason for deallocation' })
  deallocationReason: string
}

export default class DeallocationReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/manage-allocations/deallocation-reason', { deallocationReasons, allocationId })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationReason } = req.body
    const caseNoteEligibleReasonCodes = ['WITHDRAWN_STAFF', 'DISMISSED', 'SECURITY', 'OTHER']

    req.session.allocateJourney.deallocationReason = deallocationReason

    if (req.session.allocateJourney.inmates.length === 1 && caseNoteEligibleReasonCodes.includes(deallocationReason)) {
      return res.redirectOrReturn('case-note-question')
    }
    req.session.allocateJourney.deallocationCaseNote = null
    return res.redirect('check-answers')
  }
}
