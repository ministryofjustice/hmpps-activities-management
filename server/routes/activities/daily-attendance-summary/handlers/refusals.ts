import { Request, Response } from 'express'
import { toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import AttendanceReason from '../../../../enum/attendanceReason'
import PrisonService from '../../../../services/prisonService'
import { format, startOfToday, subDays } from 'date-fns'

export default class RefusedSessionsRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query

    if (!date) {
      return res.redirect('select-period')
    }
    const activityDate = toDate(req.query.date as string)
    const attendances = await this.activitiesService.getAllAttendance(activityDate, user)
    const mandatoryAttendances = attendances.filter(a => a.attendanceRequired)

    const refusedAttendances = mandatoryAttendances.filter(attendance => attendance.attendanceReasonCode === AttendanceReason.REFUSED)

    const prisonerNumbers = refusedAttendances.map(a => a.prisonerNumber)
    const inmates = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const refusedSessions = refusedAttendances
      .map(a => ({
        inmate: inmates.find(i => i.prisonerNumber === a.prisonerNumber),
        prisonerNumber: a.prisonerNumber,
        attendance: a,
      }))
      .map(a => ({
        firstName: a.inmate.firstName,
        lastName: a.inmate.lastName,
        prisonerNumber: a.prisonerNumber,
        location: a.inmate.cellLocation,
        attendance: a.attendance,
        status: a.inmate.status,
        prisonCode: a.inmate.prisonId,
        editable: (a.attendance.sessionDate >= format(subDays(startOfToday(), 7), 'yyyy-MM-dd'))
      }))

    return res.render('pages/activities/daily-attendance-summary/refusals', {
      activityDate,
      refusedSessions,
    })
  }

}
