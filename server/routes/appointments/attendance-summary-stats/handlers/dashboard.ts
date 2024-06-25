import { Request, Response } from 'express'
import { datePickerDateToIsoDate, formatIsoDate, isValidIsoDate } from '../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../services/activitiesService'
import getAttendanceSummary from '../../utils/attendanceUtils'

export default class DashboardRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, appointmentName, customAppointmentName } = req.query

    if (!isValidIsoDate(date as string)) {
      return res.redirect(`?date=${formatIsoDate(new Date())}`)
    }

    const [categories, summaries] = await Promise.all([
      this.activitiesService.getAppointmentCategories(user),
      this.activitiesService.getAppointmentAttendanceSummaries(
        user.activeCaseLoadId,
        new Date(date as string),
        user,
        appointmentName as string,
        customAppointmentName as string,
      ),
    ])

    const summariesNotCancelled = summaries.filter(s => !s.isCancelled)
    const attendanceSummary = getAttendanceSummary(summariesNotCancelled)

    return res.render('pages/appointments/attendance-summary-stats/dashboard', {
      date,
      categories,
      summariesNotCancelled,
      attendanceSummary,
      cancelledCount: summaries.length - summariesNotCancelled.length,
      appointmentName: appointmentName ?? '',
      customAppointmentName: customAppointmentName ?? '',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { date, appointmentName, customAppointmentName } = req.body

    return res.redirect(
      `?date=${datePickerDateToIsoDate(date)}&appointmentName=${appointmentName ?? ''}&customAppointmentName=${customAppointmentName ?? ''}`,
    )
  }
}
