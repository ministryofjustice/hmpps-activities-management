import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import HasAtLeastOne from '../../../../validators/hasAtLeastOne'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import UserService from '../../../../services/userService'
import PrisonService from '../../../../services/prisonService'
import { convertToTitleCase } from '../../../../utils/utils'

export class AppointmentAttendance {
  @Expose()
  @Transform(({ value }) => [value].flat()) // Transform to an array if only one value is provided
  @HasAtLeastOne({ message: 'Select at least one person' })
  prisonNumbers: string[]
}

// TODO: SAA-2197 Deprecated - remove view and test also

export default class AppointmentAttendanceRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly userService: UserService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { user } = res.locals

    const recordedBy = appointment.attendees.map(a => a.attendanceRecordedBy).filter(Boolean)
    const userMap = await this.userService.getUserMap(recordedBy, user)

    res.render('pages/appointments/appointment/attendance', {
      appointment,
      userMap,
      attendanceSummary: this.getAttendanceSummary(appointment),
    })
  }

  ATTEND = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params
    const { prisonNumbers }: { prisonNumbers: string[] } = req.body
    const { user } = res.locals

    await this.activitiesService.markAppointmentAttendance(+appointmentId, prisonNumbers, [], user)

    let successMessage = 'You’ve recorded that'
    if (prisonNumbers.length === 1) {
      const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonNumbers[0], user)
      const formattedName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)
      successMessage = `${successMessage} ${formattedName} attended this appointment`
    } else {
      successMessage = `${successMessage} ${prisonNumbers.length} people attended this appointment`
    }

    return res.redirectWithSuccess('attendance', 'Attendance recorded', successMessage)
  }

  NON_ATTEND = async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params
    const { prisonNumbers }: { prisonNumbers: string[] } = req.body
    const { user } = res.locals

    await this.activitiesService.markAppointmentAttendance(+appointmentId, [], prisonNumbers, user)

    let successMessage = 'You’ve recorded that'
    if (prisonNumbers.length === 1) {
      const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonNumbers[0], user)
      const formattedName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)
      successMessage = `${successMessage} ${formattedName} did not attend this appointment`
    } else {
      successMessage = `${successMessage} ${prisonNumbers.length} people did not attend this appointment`
    }

    return res.redirectWithSuccess('attendance', 'Non-attendance recorded', successMessage)
  }

  private getAttendanceSummary = (appointment: AppointmentDetails) => {
    const attendanceSummary = {
      attendeeCount: appointment.attendees.length,
      attended: appointment.attendees.filter(a => a.attended === true).length,
      notAttended: appointment.attendees.filter(a => a.attended === false).length,
      notRecorded: appointment.attendees.filter(a => a.attended === null).length,
      attendedPercentage: 0,
      notAttendedPercentage: 0,
      notRecordedPercentage: 0,
    }

    if (attendanceSummary.attendeeCount > 0) {
      attendanceSummary.attendedPercentage = Math.round(
        (attendanceSummary.attended / attendanceSummary.attendeeCount) * 100,
      )
      attendanceSummary.notAttendedPercentage = Math.round(
        (attendanceSummary.notAttended / attendanceSummary.attendeeCount) * 100,
      )
      attendanceSummary.notRecordedPercentage = Math.round(
        (attendanceSummary.notRecorded / attendanceSummary.attendeeCount) * 100,
      )
    }

    return attendanceSummary
  }
}
