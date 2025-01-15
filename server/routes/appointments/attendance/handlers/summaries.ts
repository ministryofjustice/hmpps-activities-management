import { Request, Response } from 'express'
import { uniq } from 'lodash'
import { isValid } from 'date-fns'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { dateFromDateOption } from '../../../../utils/datePickerUtils'
import { getAttendanceSummaryFromAttendanceSummaries } from '../../utils/attendanceUtils'
import config from '../../../../config'
import { asString, convertToNumberArray, toDateString } from '../../../../utils/utils'
import LocationType from '../../../../enum/locationType'

export default class SummariesRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateOption, date, searchTerm, locationId, locationType } = req.query

    const dateOptionDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!isValid(dateOptionDate)) {
      return res.redirect('select-date')
    }

    const locationTypeFilter = locationType !== undefined ? asString(locationType) : 'ALL'

    const summaries = (
      await this.activitiesService.getAppointmentAttendanceSummaries(user.activeCaseLoadId, dateOptionDate, user)
    )
      .filter(s => !s.isCancelled)
      .filter(s => (searchTerm ? s.appointmentName.toLowerCase().includes(asString(searchTerm).toLowerCase()) : true))
      .filter(a => {
        switch (locationTypeFilter) {
          case LocationType.OUT_OF_CELL:
            return a.internalLocation?.id === +asString(locationId)
          case LocationType.IN_CELL:
            return a.inCell
          default:
            return true
        }
      })

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
      if (!req.session.recordAppointmentAttendanceJourney) {
        req.session.recordAppointmentAttendanceJourney = {}
      }

      req.session.recordAppointmentAttendanceJourney.date = toDateString(dateOptionDate)

      const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

      return res.render('pages/appointments/attendance/summaries-multi-select', {
        date: dateOptionDate,
        summaries,
        attendanceSummary,
        prisonersDetails,
        locations,
        filterItems: filterItems(asString(locationId), locationTypeFilter),
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

  SELECT_APPOINTMENTS = async (req: Request, res: Response): Promise<void> => {
    req.session.recordAppointmentAttendanceJourney.appointmentIds = convertToNumberArray(req.body.appointmentIds)
    return res.redirect('../attendees')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, date } = req.query
    const { searchTerm, locationId, locationType } = req.body

    const redirectUrl =
      `summaries?dateOption=${dateOption ?? ''}` +
      `&date=${date ?? ''}&searchTerm=${searchTerm ?? ''}` +
      `&locationId=${locationId ?? ''}` +
      `&locationType=${locationType ?? ''}`

    res.redirect(redirectUrl)
  }
}

const filterItems = (locationId: string, locationType: string) => {
  return {
    locationType,
    locationId: locationType === LocationType.OUT_OF_CELL ? locationId : null,
  }
}
