import { Request, Response } from 'express'
import { mapToTableRow } from './activityListHelper'
import { ActivityAttendanceId, ActivityScheduleAllocation, AttendanceForm } from '../../../@types/activities'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'

function getOrInitAttendanceForm(attendanceForms: Map<string, AttendanceForm>, key: string) {
  let attForm = attendanceForms.get(key)
  if (!attForm) {
    attForm = {}
    attendanceForms.set(key, attForm)
  }
  return attForm
}

export default class AbsencesRouteHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityScheduleAllocations } = res.locals
    const { activitiesNotAttended } = req.session.data

    const activityAbsences = activityScheduleAllocations.filter((a: ActivityScheduleAllocation) => {
      return !!activitiesNotAttended.find((ana: ActivityAttendanceId) => ana.id === a.activityScheduleId)
    })

    const viewContext = {
      locationId: req.query.locationId,
      date: req.query.date as string,
      period: req.query.period as string,
      rowData: activityAbsences.map(mapToTableRow),
      paidAbsenceReasons: [
        { code: 'ACCAB', name: 'Acceptable absence' },
        { code: 'CANC', name: 'Cancelled' },
        { code: 'NREQ', name: 'Not required' },
        { code: 'SUS', name: 'Suspend' },
      ],
      unpaidAbsenceReasons: [
        { code: 'ABS', name: 'Absent' },
        { code: 'UNACAB', name: 'Unacceptable absence' },
        { code: 'REST', name: 'Rest day (no pay)' },
      ],
    }
    res.render('pages/activityListAm/absences', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { locationId, date, period } = req.body
    const attendanceForms = new Map<string, AttendanceForm>()

    // Here stepping through all the form inputs and collecting them into a map of
    // separate forms for each activity - keyed by their booking id & event id.
    Object.entries(req.body).forEach(([key, value]) => {
      if (key.startsWith('paid-reason-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.paidReason = value as string | undefined
      } else if (key.startsWith('unpaid-reason-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.unpaidReason = value as string | undefined
      }
    })

    const attendanceUpdates: AttendanceUpdateRequest[] = []
    attendanceForms.forEach((attendanceForm, key) => {
      const split = key.split('-')
      attendanceUpdates.push({
        id: +split[1],
        attendanceReason: attendanceForm.paidReason || attendanceForm.unpaidReason,
      })
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)
    const params = new URLSearchParams({
      locationId,
      date,
      period,
    })
    return res.redirect(`/activity-list-am?${params.toString()}`)
  }
}
