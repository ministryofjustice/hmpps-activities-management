import { Request, Response } from 'express'
import { uniq } from 'lodash'
import { isValid } from 'date-fns'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { dateFromDateOption } from '../../../../utils/datePickerUtils'
import { getAttendanceSummaryFromAttendanceSummaries } from '../../utils/attendanceUtils'
import config from '../../../../config'
import { convertToNumberArray, toDateString } from '../../../../utils/utils'

export default class SummariesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateOption, date } = req.query

    const dateOptionDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!isValid(dateOptionDate)) {
      return res.redirect('select-date')
    }

    const summaries = (
      await this.activitiesService.getAppointmentAttendanceSummaries(user.activeCaseLoadId, dateOptionDate, user)
    ).filter(s => !s.isCancelled)

    // Get prisoner details for appointments with a single attendee
    const prisonerNumber = summaries.flatMap(r => (r.attendees.length === 1 ? r.attendees[0].prisonerNumber : []))
    let prisonersDetails = {}
    if (prisonerNumber.length > 0) {
      prisonersDetails = (await this.prisonService.searchInmatesByPrisonerNumbers(uniq(prisonerNumber), user)).reduce(
        (prisonerMap, prisoner) => ({
          ...prisonerMap,
          [prisoner.prisonerNumber]: prisoner,
        }),
        {},
      )
    }

    const attendanceSummary = getAttendanceSummaryFromAttendanceSummaries(summaries)

    if (config.appointmentMultipleAttendanceToggleEnabled) {
      req.session.recordAppointmentAttendanceJourney.date = toDateString(dateOptionDate)

      return res.render('pages/appointments/attendance/summaries-multi-select', {
        date: dateOptionDate,
        summaries,
        attendanceSummary,
        prisonersDetails,
      })
    }

    return res.render('pages/appointments/attendance/summaries', {
      dateOption,
      date: dateOptionDate,
      summaries,
      attendanceSummary,
      prisonersDetails,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.recordAppointmentAttendanceJourney.appointmentIds = convertToNumberArray(req.body.appointmentIds)
    return res.redirect('attendees')
  }
}
