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
import EventOrganiser from '../../../../enum/eventOrganisers'
import { isPrisonerIdentifier } from '../../../../utils/utils'

export default class AttendanceDataRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, appointmentName, customAppointmentName, attendanceState, eventTier, organiserCode } = req.query
    const searchTerm = JSON.stringify(req.query.searchTerm)?.replace(/"/g, '')

    if (!isValidIsoDate(date as string)) {
      return res.redirect(`?date=${formatIsoDate(new Date())}`)
    }

    let nameSearch = null
    if (searchTerm && !isPrisonerIdentifier(searchTerm)) {
      nameSearch = searchTerm
    }

    const [categories, summaries, appointments] = await Promise.all([
      this.activitiesService.getAppointmentCategories(user),
      this.activitiesService.getAppointmentAttendanceSummaries(
        user.activeCaseLoadId,
        new Date(date as string),
        user,
        appointmentName as string,
        customAppointmentName as string,
      ),
      this.activitiesService.getAppointmentsByStatusAndDate(
        user.activeCaseLoadId,
        AttendanceStatus[attendanceState as string],
        date as string,
        user,
        appointmentName as string,
        customAppointmentName as string,
        nameSearch === null ? searchTerm : null,
        EventTier[eventTier as string],
        EventOrganiser[organiserCode as string],
      ),
    ])

    const prisonerNumbers = Array.from(new Set(appointments.map(prisoner => prisoner.prisonerNumber)))
    const prisonerDetails = new Map(
      (await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)).map(prisonerDetail => [
        prisonerDetail.prisonerNumber,
        prisonerDetail,
      ]),
    )

    const enhancedAppointments = appointments.map(appointment =>
      enhanceAppointment(appointment, prisonerDetails.get(appointment.prisonerNumber)),
    )

    let enhancedAppointmentsForSearchedPrisoner = null
    if (nameSearch) {
      enhancedAppointmentsForSearchedPrisoner = enhancedAppointments.filter(app => {
        const name = `${app.firstName} ${app.lastName}`.toLowerCase()
        return name.includes(searchTerm)
      })
    }

    return res.render('pages/appointments/attendance-summary-stats/attendanceData', {
      date,
      categories,
      summariesNotCancelled: summaries.filter(s => !s.isCancelled),
      appointmentName: appointmentName ?? '',
      customAppointmentName: customAppointmentName ?? '',
      attendanceState,
      appointments: enhancedAppointmentsForSearchedPrisoner || enhancedAppointments,
      title: getAttendanceDataTitle(AttendanceStatus[attendanceState as string], EventTier[eventTier as string]),
      subTitle: getAttendanceDataSubTitle(
        AttendanceStatus[attendanceState as string],
        EventTier[eventTier as string],
        enhancedAppointmentsForSearchedPrisoner?.length || enhancedAppointments.length,
        getSpecificAppointmentCount(appointments),
      ),
      showHostsFilter:
        AttendanceStatus[attendanceState as string] === AttendanceStatus.EVENT_TIER &&
        EventTier[eventTier as string] === EventTier.TIER_2,
      eventTier: eventTier ?? '',
      organiserCode: organiserCode ?? '',
      searchTerm: searchTerm ?? '',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { date, appointmentName, customAppointmentName, attendanceState, eventTier, organiserCode, searchTerm } =
      req.body
    return res.redirect(
      `?date=${datePickerDateToIsoDate(date)}&appointmentName=${appointmentName ?? ''}&customAppointmentName=${customAppointmentName ?? ''}&attendanceState=${attendanceState ?? ''}&eventTier=${eventTier ?? ''}&organiserCode=${organiserCode ?? ''}&searchTerm=${searchTerm ?? ''}`,
    )
  }
}
