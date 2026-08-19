import { Request, Response } from 'express'
import _ from 'lodash'
import { formatFirstLastName, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import AttendanceReason from '../../../../enum/attendanceReason'
import PrisonService from '../../../../services/prisonService'
import { getActivityLocationDescription } from '../../../../utils/activityLocationDescription'
import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

export default class SuspendedPrisonersRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query

    const categories = await this.activitiesService
      .getActivityCategories(user, user.externalActivitiesRolledOut)
      .then(result =>
        result.filter(category => user.externalActivitiesRolledOut || category.code !== ActivityCategoryEnum.SAA_ROTL),
      )
    const uniqueCategories = categories.map(category => ({
      value: category.code === ActivityCategoryEnum.SAA_ROTL ? category.code : category.name,
      text: category.name,
    }))

    // Set the default filter values if they are not set
    req.journeyData.attendanceSummaryJourney ??= {}
    req.journeyData.attendanceSummaryJourney.categoryFilters ??= null
    req.journeyData.attendanceSummaryJourney.reasonFilter ??= 'BOTH'

    const { categoryFilters, reasonFilter, searchTerm } = req.journeyData.attendanceSummaryJourney

    if (!date) {
      return res.redirect('select-period')
    }

    const activityDate = toDate(req.query.date as string)

    let reason = null
    if (reasonFilter !== 'BOTH') reason = reasonFilter
    const selectedCategoryCodes =
      categoryFilters &&
      categoryFilters.flatMap(categoryFilter => {
        const category = categories.find(c => c.name === categoryFilter || c.code === categoryFilter)
        return category ? [ActivityCategoryEnum[category.code]] : []
      })

    const suspendedPrisonerAttendance = await this.activitiesService.getSuspendedPrisonersActivityAttendance(
      activityDate,
      user,
      selectedCategoryCodes,
      reason,
    )

    req.journeyData.attendanceSummaryJourney.categoryFilters = uniqueCategories.map(category => category.value)

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(
      _.uniq(suspendedPrisonerAttendance.map(a => a.prisonerNumber)),
      user,
    )

    const suspendedAttendancesByPrisoner = suspendedPrisonerAttendance
      .map(match => {
        const prisoner = prisoners.find(p => p.prisonerNumber === match.prisonerNumber)

        return {
          prisonerNumber: prisoner.prisonerNumber,
          prisonerName: formatFirstLastName(prisoner.firstName, prisoner.lastName),
          firstName: prisoner.firstName,
          lastName: prisoner.lastName,
          status: prisoner.status,
          prisonCode: prisoner.prisonId,
          cellLocation: prisoner.cellLocation,
          sessions: _.sortBy(
            match.attendance.map(a => {
              return {
                sessionId: a.scheduledInstanceId,
                sessionSummary: a.activitySummary,
                sessionStartTime: a.startTime,
                sessionEndTime: a.endTime,
                sessionSlot: a.timeSlot,
                sessionLocation: getActivityLocationDescription(a.inCell, a.onWing, a.offWing, a.internalLocation),
              }
            }),
            'sessionStartTime',
          ),
          reason: match.attendance.find(a => a.attendanceReasonCode === AttendanceReason.AUTO_SUSPENDED)
            ? 'Temporarily released or transferred'
            : 'Suspended',
          timeSlots: match.attendance.map(a => a.timeSlot),
        }
      })
      .filter(
        c =>
          this.includesSearchTerm(c.prisonerName, searchTerm) || this.includesSearchTerm(c.prisonerNumber, searchTerm),
      )

    return res.render('pages/activities/daily-attendance-summary/suspended-prisoners', {
      uniqueCategories,
      activityDate,
      suspendedAttendancesByPrisoner,
    })
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())
}
