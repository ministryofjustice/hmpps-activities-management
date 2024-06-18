import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import { dateFromDateOption } from '../../../../utils/datePickerUtils'
import DateOption from '../../../../enum/dateOption'

export default class DashboardRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, date } = req.query

    const dateOptionDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!isValid(dateOptionDate)) {
      return res.redirect('select-date')
    }
    return res.render('pages/appointments/attendance-summary-stats/dashboard', {
      dateOption,
      date: dateOptionDate,
    })
  }
}
