import { Request, Response } from 'express'
import _ from 'lodash'
import { toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import EventTier from '../../../../enum/eventTiers'

enum PayCategory {
  PAY = 'PAY',
  NO_PAY = 'NO_PAY',
}

export default class DailyAttendanceRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, status, eventTier } = req.query

    if (!date) {
      return res.redirect('select-period')
    }
    const activityDate = toDate(req.query.date as string)
    const tier = eventTier && EventTier[eventTier as keyof typeof EventTier]
    const attendances = await this.activitiesService.getAllAttendance(activityDate, user, tier)
    const mandatoryAttendances = attendances.filter(a => a.attendanceRequired)
    const attendancesForStatus = mandatoryAttendances.filter(a => {
      if (status === 'NotAttended') return a.status === AttendanceStatus.WAITING
      if (status === 'Attended')
        return a.status === AttendanceStatus.COMPLETED && a.attendanceReasonCode === AttendanceReason.ATTENDED
      if (status === 'Absences')
        return a.status === AttendanceStatus.COMPLETED && a.attendanceReasonCode !== AttendanceReason.ATTENDED
      return false
    })

    const uniqueCategories = _.uniq(attendancesForStatus.map(c => c.categoryName))
    const absenceReasons = Object.keys(AttendanceReason).filter(reason => reason !== AttendanceReason.ATTENDED)
    const payCategories = Object.keys(PayCategory)

    // Set the default filter values if they are not set
    req.session.attendanceSummaryJourney ??= {}
    req.session.attendanceSummaryJourney.categoryFilters ??= uniqueCategories
    req.session.attendanceSummaryJourney.absenceReasonFilters ??= absenceReasons
    req.session.attendanceSummaryJourney.payFilters ??= payCategories

    const { categoryFilters, searchTerm, absenceReasonFilters, payFilters } = req.session.attendanceSummaryJourney

    const attendancesMatchingCategoryFilter = attendancesForStatus.filter(a => categoryFilters.includes(a.categoryName))
    // const attendancesMatchingPayFilter = attendancesMatchingCategoryFilter.filter(a =>
    //   this.payFilter(a.issuePayment, payFilters),
    // )
    const attendancesMatchingAllFilters = attendancesMatchingCategoryFilter.filter(a =>
      absenceReasonFilters.includes(a.attendanceReasonCode),
    )

    const prisonerNumbers = attendancesMatchingAllFilters.map(a => a.prisonerNumber)

    const inmates = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const attendees = attendancesMatchingAllFilters
      .map(a => ({
        inmate: inmates.find(i => i.prisonerNumber === a.prisonerNumber),
        prisonerNumber: a.prisonerNumber,
        attendance: a,
      }))
      .map(a => ({
        name: `${a.inmate.firstName} ${a.inmate.lastName}`,
        prisonerNumber: a.prisonerNumber,
        location: a.inmate.cellLocation,
        attendance: a.attendance,
        status: a.inmate.status,
        prisonCode: a.inmate.prisonId,
      }))
      .filter(
        a =>
          !searchTerm ||
          this.includesSearchTerm(a.name, searchTerm) ||
          this.includesSearchTerm(a.prisonerNumber, searchTerm),
      )

    return res.render('pages/activities/daily-attendance-summary/attendances', {
      activityDate,
      uniqueCategories,
      absenceReasons,
      payCategories,
      status,
      attendees,
      tier,
    })
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())

  // private payFilter = (issuePayment: boolean, payFilter: string[]) => {
  //   if (payFilter.includes(PayCategory.PAY) && issuePayment) return true
  //   if (payFilter.includes(PayCategory.NO_PAY) && !issuePayment) return true
  //   return false
  // }
}
