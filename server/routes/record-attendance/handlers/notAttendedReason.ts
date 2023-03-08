import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'

export class NotAttendedReason {
  @Expose()
  selectedPrisoners: string[]
}

export default class NotAttendedReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { selectedPrisoners } = req.session.notAttendedJourney

    const notAttendedReasons = [
      { reasonId: 1, reasonCode: 'SICK', reasonName: 'Sick' },
      { reasonId: 2, reasonCode: 'REFUSED', reasonName: 'Refused to attend' },
      { reasonId: 3, reasonCode: 'NREQ', reasonName: 'Not required or excused' },
      { reasonId: 4, reasonCode: 'REST', reasonName: 'Rest day' },
      { reasonId: 5, reasonCode: 'CLASH', reasonName: "Prisoner's schedule shows another activity" },
      { reasonId: 6, reasonCode: 'OTHER', reasonName: 'Other absence reason not listed' },
    ]

    return res.render('pages/record-attendance/not-attended-reason', { notAttendedReasons, selectedPrisoners })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const instanceId = req.params.id
    const attendanceUpdates: AttendanceUpdateRequest[] = []

    req.session.notAttendedJourney.selectedPrisoners.forEach(selectedPrisoner => {
      attendanceUpdates.push({
        id: selectedPrisoner.attendanceId,
        attendanceReason: req.body.notAttendedReason,
      })
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)
    res.redirectOrReturn(`/attendance/activities/${instanceId}/attendance-list`)
  }
}
