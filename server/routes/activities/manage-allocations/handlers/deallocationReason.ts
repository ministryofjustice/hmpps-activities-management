import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'

export class DeallocationReason {
  @Expose()
  @IsNotEmpty({ message: "Select why you're taking this person off the activity" })
  deallocationReason: string
}

export default class DeallocationReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const deallocationReasons = await this.activitiesService.getDeallocationReasons(user)

    res.render('pages/activities/manage-allocations/deallocation-reason', { deallocationReasons })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { deallocationReason } = req.body
    const caseNoteEligibleReasonCodes = ['WITHDRAWN_STAFF', 'DISMISSED', 'SECURITY', 'OTHER']
    const { deallocateAfterAllocationDateOption } = req.session.allocateJourney

    if (
      req.session.allocateJourney.inmates.length === 1 &&
      caseNoteEligibleReasonCodes.includes(deallocationReason) &&
      deallocateAfterAllocationDateOption === undefined
    ) {
      return res.redirectOrReturn('case-note-question')
    }
    req.session.allocateJourney.deallocationCaseNote = null
    return res.redirect('check-answers')
  }
}
