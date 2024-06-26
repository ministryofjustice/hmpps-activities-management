import { Request, Response } from 'express'
import { datePickerDateToIsoDate, formatIsoDate, isValidIsoDate } from '../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../services/activitiesService'
import { AttendanceStatus } from '../../../../@types/appointments'
import {
  enhanceAppointment,
  getAttendanceDataSubTitle,
  getAttendanceDataTitle,
  getSpecificAppointmentCount,
} from '../../utils/attendanceUtils'
import EventTier from '../../../../enum/eventTiers'
import PrisonService from '../../../../services/prisonService'

export default class AttendanceDataRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService
  ) {}

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

    const prisonerNumbers = Array.from(new Set(appointments.map(prisoner => prisoner.prisonerNumber)))
    const prisonerDetails = new Map(
      (await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)).map(prisonerDetail => [
        prisonerDetail.prisonerNumber,
        prisonerDetail,
      ])
    )

    const enhancedAppointments = appointments.map(appointment =>
      enhanceAppointment(appointment, prisonerDetails.get(appointment.prisonerNumber))
    )

    const summariesNotCancelled = summaries.filter(s => !s.isCancelled)

    return res.render('pages/appointments/attendance-summary-stats/attendanceData', {
      date,
      categories,
      summariesNotCancelled,
      appointmentName: appointmentName ?? '',
      customAppointmentName: customAppointmentName ?? '',
      attendanceState,
      appointments: enhancedAppointments,
      title: getAttendanceDataTitle(AttendanceStatus[attendanceState as string], EventTier[eventTier as string]),
      subTitle: getAttendanceDataSubTitle(
        AttendanceStatus[attendanceState as string],
        EventTier[eventTier as string],
        appointments.length,
        getSpecificAppointmentCount(appointments)
      ),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { date, appointmentName, customAppointmentName, attendanceState, eventTier } = req.body

    return res.redirect(
      `?date=${datePickerDateToIsoDate(date)}&appointmentName=${appointmentName ?? ''}&customAppointmentName=${customAppointmentName ?? ''}&attendanceState=${attendanceState ?? ''}&eventTier=${eventTier}`
    )
  }
}
