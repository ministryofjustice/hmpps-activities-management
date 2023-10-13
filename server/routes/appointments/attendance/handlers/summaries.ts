import { Request, Response } from 'express'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'
import { dateFromDateOption } from '../../../../utils/datePickerUtils'

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
    })
  }
}
