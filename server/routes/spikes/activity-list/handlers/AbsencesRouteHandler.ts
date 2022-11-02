import { Request, Response } from 'express'
import { mapToTableRow } from './activityListHelper'
import { ActivityByLocation, AttendanceForm, CodeNameStringPair, OffenderActivityId } from '../../../../@types/dps'
import PrisonService from '../../../../services/prisonService'
import { AttendanceDto } from '../../../../@types/whereaboutsApiImport/types'
import { CreateAttendanceDtoLenient, UpdateAttendanceDtoLenient } from '../../../../@types/whereaboutsApiImportCustom'

function getOrInitAttendanceForm(attendanceForms: Map<string, AttendanceForm>, key: string) {
  let attForm = attendanceForms.get(key)
  if (!attForm) {
    attForm = {}
    attendanceForms.set(key, attForm)
  }
  return attForm
}

export default class AbsencesRouteHandler {
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
    res.render('pages/spikes/activityList/absences', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user, activityList } = res.locals
    const { locationId, date, period } = req.body
    const attendanceForms = new Map<string, AttendanceForm>()

    // Here stepping through all the form inputs and collecting them into a map of
    // separate forms for each activity - keyed by their booking id & event id.
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

    function getUnpaidReason(unpaidReason: string, incentiveWarning: string) {
      if (unpaidReason === 'Refused' && incentiveWarning === 'yes') {
        return 'RefusedIncentiveLevelWarning'
      }
      if (unpaidReason === 'UnacceptableAbsence' && incentiveWarning === 'yes') {
        return 'UnacceptableAbsenceIncentiveLevelWarning'
      }
      return unpaidReason
    }

    const calls: Promise<AttendanceDto>[] = []

    attendanceForms.forEach((attendanceForm, key) => {
      const split = key.split('-')
      const [bookingId, eventId] = split

      const activity = activityList.find(
        (a: ActivityByLocation) => a.bookingId === +bookingId && a.eventId === +eventId,
      )

      const attendanceId = activity?.attendanceInfo?.id
      // let attendanceDto: UpdateAttendanceDtoLenient | CreateAttendanceDtoLenient
      const paid = attendanceForm.pay === 'yes'
      if (typeof attendanceId !== 'undefined') {
        const attendanceDto: UpdateAttendanceDtoLenient = {
          attended: false,
          paid,
          absentReason: paid
            ? attendanceForm.paidReason || undefined
            : getUnpaidReason(attendanceForm.unpaidReason, attendanceForm.incentiveWarning) || undefined,
          absentSubReason: paid
            ? attendanceForm.paidSubReason || undefined
            : attendanceForm.unpaidSubReason || undefined,
          comments: attendanceForm.moreDetail,
        }
        calls.push(this.prisonService.createUpdateAttendance(attendanceId, date, attendanceDto, user))
      } else {
        const attendanceDto: CreateAttendanceDtoLenient = {
          bookingId: +bookingId,
          eventId: +eventId,
          eventLocationId: locationId,
          period,
          prisonId: user.activeCaseLoad.caseLoadId,
          eventDate: date,
          attended: false,
          paid,
          absentReason: paid
            ? attendanceForm.paidReason || undefined
            : getUnpaidReason(attendanceForm.unpaidReason, attendanceForm.incentiveWarning) || undefined,
          absentSubReason: paid
            ? attendanceForm.paidSubReason || undefined
            : attendanceForm.unpaidSubReason || undefined,
          comments: attendanceForm.moreDetail,
        }
        calls.push(this.prisonService.createUpdateAttendance(attendanceId, date, attendanceDto, user))
      }
    })

    await Promise.all(calls)

    const params = new URLSearchParams({
      locationId,
      date,
      period,
    })
    return res.redirect(`/activity-list?${params.toString()}`)
  }
}
