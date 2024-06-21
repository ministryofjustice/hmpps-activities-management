import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { dateFromDateOption } from '../../../../utils/datePickerUtils'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'
import getAttendanceSummary from '../../utils/attendanceUtils'

export default class DashboardRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateOption, date } = req.query

    const dateOptionDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!isValid(dateOptionDate)) {
      return res.redirect('select-date')
    }

    const summaries = await this.activitiesService.getAppointmentAttendanceSummaries(
      user.activeCaseLoadId,
      dateOptionDate,
      user,
    )

    const summariesNotCancelled = summaries.filter(s => !s.isCancelled)
    const attendanceSummary = getAttendanceSummary(summariesNotCancelled)

    return res.render('pages/appointments/attendance-summary-stats/dashboard', {
      dateOption,
      date: dateOptionDate,
      summariesNotCancelled,
      attendanceSummary,
      cancelledCount: summaries.filter(s => s.isCancelled).length,
    })
  }
}
