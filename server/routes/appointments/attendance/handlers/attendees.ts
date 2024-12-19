import { Request, Response } from 'express'
import { uniq } from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { MultipleAppointmentAttendanceRequest } from '../../../../@types/activitiesAPI/types'
import UserService from '../../../../services/userService'
import { convertToArray } from '../../../../utils/utils'
import AttendanceAction from '../../../../enum/attendanceAction'
import { getAttendanceSummaryFromAppointmentDetails } from '../../utils/attendanceUtils'

export default class AttendeesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly userService: UserService,
  ) {}

  GET_MULTIPLE = async (req: Request, res: Response): Promise<void> => {
    const { appointmentIds } = req.session.recordAppointmentAttendanceJourney
    const { user } = res.locals

    const appointments = await this.activitiesService.getAppointments(appointmentIds, user)

    const recordedBy = uniq(
      appointments.flatMap(appointment =>
        appointment.attendees.map(attendee => attendee.attendanceRecordedBy).filter(Boolean),
      ),
    )

    const userMap = await this.userService.getUserMap(recordedBy, user)

    return res.render('pages/appointments/attendance/attendees', {
      appointments,
      userMap,
      attendanceSummary: getAttendanceSummaryFromAppointmentDetails(appointments),
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

  private updateAttendances = async (req: Request, res: Response, action: AttendanceAction): Promise<void> => {
    const attendanceIds: string[] = convertToArray(req.body.attendanceIds)
    const { user } = res.locals

    const appointmentsMap = new Map<number, string[]>()

    attendanceIds.forEach(attendanceId => {
      const [appointmentIdStr, prisonerNumber] = attendanceId.split('-')

      const appointmentId = +appointmentIdStr

      if (!appointmentsMap.has(appointmentId)) {
        appointmentsMap.set(appointmentId, [])
      }

      appointmentsMap.get(appointmentId).push(prisonerNumber)
    })

    const requests: MultipleAppointmentAttendanceRequest[] = []

    appointmentsMap.forEach((prisonerNumbers, appointmentId) => {
      requests.push({ appointmentId, prisonerNumbers })
    })

    await this.activitiesService.updateMultipleAppointmentAttendances(action, requests, user)

    const successMessage = `You've saved attendance details for ${attendanceIds.length} ${
      attendanceIds.length === 1 ? 'attendee' : 'attendees'
    }`

    return res.redirectWithSuccess('attendees', 'Attendance recorded', successMessage)
  }
}
