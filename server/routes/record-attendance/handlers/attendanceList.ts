import { Request, Response } from 'express'
import { parse } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { getAttendanceSummary } from '../../../utils/utils'
import PrisonService from '../../../services/prisonService'
import { Attendance } from '../../../@types/activitiesAPI/types'

export default class AttendanceListRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const instanceId = req.params.id
    const { user } = res.locals

    const instance = await this.activitiesService.getScheduledActivity(instanceId as unknown as number, user)
    const prisonerNumbers = instance.attendances.map(a => a.prisonerNumber)

    const attendees = await this.prisonService.getInmateDetails(prisonerNumbers, user).then(inmates =>
      inmates.map(i => ({
        name: `${i.firstName} ${i.lastName}`,
        prisonerNumber: i.offenderNo,
        location: i.assignedLivingUnitDesc,
        attendanceLabel: this.getAttendanceLabel(i.offenderNo, instance.attendances),
      }))
    )

    return res.render('pages/record-attendance/attendance-list', {
      activity: {
        name: instance.activitySchedule.activity.summary,
        location: instance.activitySchedule.internalLocation.description,
        time: `${instance.startTime} - ${instance.endTime}`,
        date: parse(instance.date, 'dd/MM/yyyy', new Date()),
        prisonerNumbers: instance.attendances.map(a => a.prisonerNumber),
        ...getAttendanceSummary(instance.attendances),
      },
      attendees,
    })
  }

  private getAttendanceLabel = (prisonerNumber: string, attendances: Attendance[]) => {
    const attendance = attendances.find(a => a.prisonerNumber === prisonerNumber)
    if (attendance.status === 'SCHEDULED') {
      return 'Not attended yet'
    }
    return attendance.attendanceReason.code === 'ATT' ? 'Attended' : 'Absent'
  }
}
