import { Request, Response } from 'express'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'
import { dateFromDateOption } from '../../../../utils/datePickerUtils'
import { AppointmentAttendanceSummary } from '../../../../@types/activitiesAPI/types'

export default class SummariesRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateOption, date } = req.query

    const dateOptionDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!dateOptionDate) {
      return res.redirect('select-date')
    }

    const summaries = (
      await this.activitiesService.getAppointmentAttendanceSummaries(user.activeCaseLoadId, dateOptionDate, user)
    ).filter(s => !s.isCancelled)

    return res.render('pages/appointments/attendance/summaries', {
      dateOption,
      date: dateOptionDate,
      summaries,
      attendanceSummary: this.getAttendanceSummary(summaries),
    })
  }

  private getAttendanceSummary = (summaries: AppointmentAttendanceSummary[]) => {
    const attendanceSummary = {
      attendeeCount: summaries.map(s => s.attendeeCount).reduce((sum, count) => sum + count, 0),
      attended: summaries.map(s => s.attendedCount).reduce((sum, count) => sum + count, 0),
      notAttended: summaries.map(s => s.nonAttendedCount).reduce((sum, count) => sum + count, 0),
      notRecorded: summaries.map(s => s.notRecordedCount).reduce((sum, count) => sum + count, 0),
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