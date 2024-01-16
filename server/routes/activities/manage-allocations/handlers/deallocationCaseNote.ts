import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength } from 'class-validator'
import { ActivitySchedule, DeallocationReason } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'

export class DeallocationCaseNote {
  @Expose()
  @IsIn(['GEN', 'NEG'], { message: 'Select the type of case note' })
  type: string

  @Expose()
  @IsNotEmpty({ message: 'Enter a case note' })
  @MaxLength(3800, { message: 'Case note must be $constraint1 characters or less' })
  text: string
}

export default class DeallocationCaseNoteRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/manage-allocations/deallocation-case-note')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { activity, deallocationReason } = req.session.allocateJourney
    const { user } = res.locals
    const { type, text } = req.body

    const [schedule, reason]: [ActivitySchedule, DeallocationReason] = await Promise.all([
      this.activitiesService.getActivitySchedule(activity.scheduleId, user),
      this.activitiesService
        .getDeallocationReasons(user)
        .then(reasons => reasons.find(r => r.code === deallocationReason)),
    ])

    req.session.allocateJourney.deallocationCaseNote = {
      type,
      text: this.getCaseNote(schedule, reason.description, text),
    }
    return res.redirect('check-answers')
  }

  private getCaseNote = (schedule: ActivitySchedule, reason: string, caseNote: string) =>
    caseNote
      ? ['Deallocated from activity', reason, `${schedule.activity.summary}\n\n${caseNote}`]
          .filter(Boolean)
          .join(' - ')
          .slice(0, 4000)
      : null
}
