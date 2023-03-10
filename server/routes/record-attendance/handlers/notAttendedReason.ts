import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'

export class NotAttendedReason {
  @Expose()
  selectedPrisoners: string[]
}

export default class NotAttendedReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedPrisoners } = req.session.notAttendedJourney

    const notAttendedReasons = await this.activitiesService
      .getAttendanceReasons(user)
      .then(reasons => reasons.filter(r => r.displayInAbsence))
      .then(reasons => _.sortBy(reasons, 'displaySequence'))

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
