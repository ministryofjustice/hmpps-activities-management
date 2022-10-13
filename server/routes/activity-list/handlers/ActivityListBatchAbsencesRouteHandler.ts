import { Request, Response } from 'express'
import { mapToTableRow } from './activityListHelper'
import { ActivityByLocation, AttendanceForm, CodeNameStringPair, OffenderActivityId } from '../../../@types/dps'
import PrisonService from '../../../services/prisonService'

function getOrInitAttendanceForm(attendanceForms: Map<string, AttendanceForm>, key: string) {
  let attForm = attendanceForms.get(key)
  if (!attForm) {
    attForm = {}
    attendanceForms.set(key, attForm)
  }
  return attForm
}

export default class ActivityListBatchAbsencesRouteHandler {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { activityList, absenceReasons } = res.locals
    const { activitiesNotAttended } = req.session.data

    const activityAbsences = activityList.filter((a: ActivityByLocation) => {
      return !!activitiesNotAttended.find(
        (ana: OffenderActivityId) => ana.bookingId === a.bookingId && ana.activityId === a.eventId,
      )
    })

    const viewContext = {
      locationId: req.query.locationId,
      date: req.query.date as string,
      period: req.query.period as string,
      rowData: activityAbsences.map(mapToTableRow),
      paidAbsenceReasons: absenceReasons?.paidReasons,
      unpaidAbsenceReasons: absenceReasons?.unpaidReasons.filter(
        (r: CodeNameStringPair) => !r.code.includes('Warning'),
      ),
      paidAbsenceSubReasons: absenceReasons?.paidSubReasons,
      unpaidAbsenceSubReasons: absenceReasons?.unpaidSubReasons,
    }
    res.render('pages/activityList/absences', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user, absenceReasons } = res.locals
    const { locationId, date, period } = req.body
    const attendanceForms = new Map<string, AttendanceForm>()

    Object.entries(req.body).forEach(([key, value]) => {
      if (key.startsWith('pay-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[1]}-${split[2]}`)
        attForm.pay = value as string | undefined
      } else if (key.startsWith('more-detail-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.moreDetail = value as string | undefined
      } else if (key.startsWith('paid-reason-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.paidReason = value as string | undefined
      } else if (key.startsWith('paid-subreason-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.paidSubReason = value as string | undefined
      } else if (key.startsWith('unpaid-reason-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.unpaidReason = value as string | undefined
      } else if (key.startsWith('unpaid-subreason-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.unpaidSubReason = value as string | undefined
      } else if (key.startsWith('incentive-warning-')) {
        const split = key.split('-')
        const attForm = getOrInitAttendanceForm(attendanceForms, `${split[2]}-${split[3]}`)
        attForm.incentiveWarning = value as string | undefined
      }
    })

    const paidAbsences: OffenderActivityId[] = []
    const unpaidAbsences: OffenderActivityId[] = []
    let paidReason = ''
    let unpaidReason = ''
    let paidComments = ''
    let unpaidComments = ''

    attendanceForms.forEach((attendanceForm, key) => {
      const split = key.split('-')
      const id = {
        bookingId: +split[0],
        activityId: +split[1],
      }
      if (attendanceForm.pay === 'yes') {
        paidAbsences.push(id)
        // TODO This next bit is not for for purpose - an alpha workaround for limit in DPS API
        paidReason = attendanceForm.paidReason
        paidComments = `${attendanceForm.paidSubReason}. ${attendanceForm.moreDetail}`
      } else {
        unpaidAbsences.push(id)
        // TODO This is not for for purpose - an alpha workaround for limit in DPS API
        unpaidReason = attendanceForm.unpaidReason
        if (attendanceForm.unpaidReason === 'Refused' && attendanceForm.incentiveWarning === 'yes') {
          paidReason = 'RefusedIncentiveLevelWarning'
        } else if (attendanceForm.unpaidReason === 'UnacceptableAbsence' && attendanceForm.incentiveWarning === 'yes') {
          unpaidReason = 'UnacceptableAbsenceIncentiveLevelWarning'
        } else {
          unpaidReason = attendanceForm.unpaidReason
        }
        const subReason = absenceReasons?.unpaidSubReasons.find(
          (r: CodeNameStringPair) => r.code === attendanceForm.unpaidSubReason,
        )
        unpaidComments = `${subReason.name}. ${attendanceForm.moreDetail}`
      }
    })

    const calls = []
    if (paidAbsences.length > 0) {
      calls.push(
        this.prisonService.batchUpdateAttendance(
          user.activeCaseLoad.caseLoadId,
          locationId,
          date,
          period,
          paidAbsences,
          false,
          true,
          paidReason,
          paidComments,
          user,
        ),
      )
    }

    if (unpaidAbsences.length > 0) {
      calls.push(
        this.prisonService.batchUpdateAttendance(
          user.activeCaseLoad.caseLoadId,
          locationId,
          date,
          period,
          unpaidAbsences,
          false,
          false,
          unpaidReason,
          unpaidComments,
          user,
        ),
      )
    }

    await Promise.all(calls)

    const params = new URLSearchParams({
      locationId,
      date,
      period,
    })
    return res.redirect(`/activity-list?${params.toString()}`)
  }
}
