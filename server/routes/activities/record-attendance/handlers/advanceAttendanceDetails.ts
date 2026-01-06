import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'
import { AdvanceAttendance, ScheduledActivity } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

export default class AdvanceAttendanceDetailsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { id } = req.params
    const { advanceAttendanceId } = req.params

    const [instance, advanceAttendance]: [ScheduledActivity, AdvanceAttendance] = await Promise.all([
      this.activitiesService.getScheduledActivity(+id, user),
      this.activitiesService.getAdvanceAttendanceDetails(+advanceAttendanceId, user),
    ])

    const [attendee, userMap]: [Prisoner, Map<string, UserDetails>] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(advanceAttendance.prisonerNumber, user),
      this.userService.getUserMap([advanceAttendance.recordedBy], user),
    ])

    return res.render('pages/activities/record-attendance/advance-attendance-details', {
      instance,
      advanceAttendance,
      attendee,
      userMap,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { advanceAttendanceId } = req.params
    return res.redirect(`${advanceAttendanceId}/reset`)
  }
}
