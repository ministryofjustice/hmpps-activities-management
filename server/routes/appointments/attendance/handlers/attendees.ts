import { Request, Response } from 'express'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { MultipleAppointmentAttendanceRequest } from '../../../../@types/activitiesAPI/types'
import { asString, convertToArray, eventClashes, toDate, formatName } from '../../../../utils/utils'
import AttendanceAction from '../../../../enum/attendanceAction'
import { getAttendanceSummaryFromAppointmentDetails } from '../../utils/attendanceUtils'
import { EventType, Prisoner } from '../../../../@types/activities'
import applyCancellationDisplayRule from '../../../../utils/applyCancellationDisplayRule'
import { NameFormatStyle } from '../../../../utils/helpers/nameFormatStyle'

export default class AttendeesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET_MULTIPLE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentIds } = req.session.recordAppointmentAttendanceJourney
    const { user } = res.locals
    const { searchTerm } = req.query

    const appointments = await this.activitiesService.getAppointments(appointmentIds, user)

    const prisonerNumbers = _.uniq(
      appointments.flatMap(appointment => appointment.attendees.map(att => att.prisoner.prisonerNumber)),
    )

    const events = await this.activitiesService.getScheduledEventsForPrisoners(
      toDate(appointments[0].startDate),
      prisonerNumbers,
      user,
    )

    const allEvents = [
      ...events.activities,
      ...events.appointments,
      ...events.courtHearings,
      ...events.visits,
      ...events.adjudications,
    ]

    const attendeeRows = []

    appointments.forEach(appointment => {
      appointment.attendees
        .filter(attendee => {
          if (!searchTerm) {
            return true
          }

          const { prisoner } = attendee

          const term = asString(searchTerm).toLowerCase()

          return (
            prisoner.firstName.toLowerCase().includes(term) ||
            prisoner.lastName.toLowerCase().includes(term) ||
            prisoner.prisonerNumber.toLowerCase().includes(term)
          )
        })
        .forEach(attendee => {
          const otherEvents = allEvents
            .filter(e => e.prisonerNumber === attendee.prisoner.prisonerNumber)
            .filter(e => e.appointmentId !== appointment.id)
            .filter(e => eventClashes(e, appointment))
            .filter(e => e.eventType !== EventType.APPOINTMENT || applyCancellationDisplayRule(e))

          attendeeRows.push({
            ...attendee,
            appointment,
            otherEvents,
          })
        })
    })

    return res.render('pages/appointments/attendance/attendees', {
      attendeeRows,
      numAppointments: appointments.length,
      attendanceSummary: getAttendanceSummaryFromAppointmentDetails(attendeeRows),
    })
  }

  GET_SINGLE = async (req: Request, res: Response): Promise<void> => {
    req.session.recordAppointmentAttendanceJourney = {
      appointmentIds: [+req.params.appointmentId],
    }
    return res.redirect('../attendees')
  }

  ATTEND = async (req: Request, res: Response): Promise<void> => {
    return this.updateAttendances(req, res, AttendanceAction.ATTENDED)
  }

  NON_ATTEND = async (req: Request, res: Response): Promise<void> => {
    return this.updateAttendances(req, res, AttendanceAction.NOT_ATTENDED)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm } = req.body

    const redirectUrl = `attendees?searchTerm=${searchTerm ?? ''}`

    res.redirect(redirectUrl)
  }

  private updateAttendances = async (req: Request, res: Response, action: AttendanceAction): Promise<void> => {
    const attendanceIds: string[] = convertToArray(req.body.attendanceIds)
    const { user } = res.locals
    let prisonerName

    const appointmentsMap = new Map<number, string[]>()

    attendanceIds.forEach(attendanceId => {
      const [appointmentIdStr, prisonerNumber] = attendanceId.split('-')

      const appointmentId = +appointmentIdStr

      if (!appointmentsMap.has(appointmentId)) {
        appointmentsMap.set(appointmentId, [])
      }

      appointmentsMap.get(appointmentId).push(prisonerNumber)
    })

    if (attendanceIds.length === 1) {
      const selectedPrisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(
        attendanceIds[0].split('-')[1],
        user,
      )

      prisonerName = formatName(
        selectedPrisoner.firstName,
        undefined,
        selectedPrisoner.lastName,
        NameFormatStyle.firstLast,
        false,
      )
    }

    const requests: MultipleAppointmentAttendanceRequest[] = []

    appointmentsMap.forEach((prisonerNumbers, appointmentId) => {
      requests.push({ appointmentId, prisonerNumbers })
    })

    await this.activitiesService.updateMultipleAppointmentAttendances(action, requests, user)

    const successHeader = action === AttendanceAction.ATTENDED ? 'Attendance recorded' : 'Non-attendance recorded'
    const successMessage = `You've saved attendance details for ${
      attendanceIds.length === 1 ? prisonerName : `${attendanceIds.length} attendees`
    }`

    return res.redirectWithSuccess('../attendees', successHeader, successMessage)
  }
}
