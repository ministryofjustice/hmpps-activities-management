import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'

export default class AppointmentAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/appointment/attendance', {
      appointment,
      attendanceSummary: this.getAttendanceSummary(appointment),
    })
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
      lastMarkedAttendee: appointment.attendees
        .filter(a => a.attended)
        .sort((a, b) => {
          const aDate = new Date(b.attendanceRecordedTime)
          const bDate = new Date(a.attendanceRecordedTime)
          if (bDate > aDate) return -1
          if (aDate < bDate) return 1
          return 0
        })
        .pop(),
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
