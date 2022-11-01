import { Request, Response } from 'express'
import { mapToTableRow } from './activityListHelper'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'
import { ActivityAttendanceId } from '../../../@types/activities'

export default class ActivityListRouteHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityScheduleAllocations } = res.locals
    const viewContext = {
      locationId: req.query.locationId,
      date: req.query.date as string,
      period: req.query.period as string,
      rowData: activityScheduleAllocations.map(mapToTableRow),
    }
    res.render('pages/activityListAm/index', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationId, date, period } = req.body
    const activitiesAttended: ActivityAttendanceId[] = []
    const activitiesNotAttended: ActivityAttendanceId[] = []
    Object.entries(req.body).forEach(([key, value]) => {
      if (key.startsWith('attended-id-')) {
        const split = key.substring(12).split('-')
        const id = {
          id: +split[0],
          attendanceId: +split[1],
        }
        if (value === 'yes') {
          activitiesAttended.push(id)
        } else {
          activitiesNotAttended.push(id)
        }
      }
    })

    if (activitiesAttended.length > 0) {
      const attendedUpates: AttendanceUpdateRequest[] = activitiesAttended.map(activityAttendedId => {
        return { id: +activityAttendedId.attendanceId, attendanceReason: 'ATT' }
      })
      await this.activitiesService.updateAttendances(attendedUpates, user)
    }

    const params = new URLSearchParams({
      locationId,
      date,
      period,
    })

    if (activitiesNotAttended.length > 0) {
      req.session.data = {
        activitiesNotAttended,
      }
      return res.redirect(`/activity-list-am/absences?${params.toString()}`)
    }
    return res.redirect(`/activity-list-am?${params.toString()}`)
  }
}
