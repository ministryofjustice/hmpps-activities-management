import { Request, Response } from 'express'
import { datePickerDateToIsoDate, formatIsoDate, isValidIsoDate } from '../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../services/activitiesService'
import { AttendanceStatus } from '../../../../@types/appointments'
import { getAttendanceDataSubTitle, getAttendanceDataTitle, getAttendeeCount } from '../../utils/attendanceUtils'
import EventTier from '../../../../enum/eventTiers'

export default class AttendanceDataRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, appointmentName, customAppointmentName, attendanceState, eventTier, prisonerNumber } = req.query

    if (!isValidIsoDate(date as string)) {
      return res.redirect(`?date=${formatIsoDate(new Date())}`)
    }

    const [categories, summaries, appointments] = await Promise.all([
      this.activitiesService.getAppointmentCategories(user),
      this.activitiesService.getAppointmentAttendanceSummaries(
        user.activeCaseLoadId,
        new Date(date as string),
        user,
        appointmentName as string,
        customAppointmentName as string
      ),
      this.activitiesService.getAppointmentsByStatusAndDate(
        user.activeCaseLoadId,
        AttendanceStatus[attendanceState as string],
        date as string,
        user,
        appointmentName as string,
        customAppointmentName as string,
        prisonerNumber as string,
        EventTier[eventTier as string]
      ),
    ])
    // console.log(appointments)
    // const attendeeCount = getAttendeeCount(appointments)

    const summariesNotCancelled = summaries.filter(s => !s.isCancelled)

    const attendanceCount = 10
    const appointmentCount = 2

    return res.render('pages/appointments/attendance-summary-stats/attendanceData', {
      date,
      categories,
      summariesNotCancelled,
      appointmentName: appointmentName ?? '',
      customAppointmentName: customAppointmentName ?? '',
      attendanceState,
      title: getAttendanceDataTitle(AttendanceStatus[attendanceState as string], EventTier[eventTier as string]),
      subTitle: getAttendanceDataSubTitle(
        AttendanceStatus[attendanceState as string],
        EventTier[eventTier as string],
        attendanceCount,
        appointmentCount
      ),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { date, appointmentName, customAppointmentName, attendanceState, eventTier } = req.body

    return res.redirect(
      `?date=${datePickerDateToIsoDate(date)}&appointmentName=${appointmentName ?? ''}&customAppointmentName=${customAppointmentName ?? ''}&attendanceState=${attendanceState ?? ''}&eventTier=${eventTier}`,
    )
  }
}
