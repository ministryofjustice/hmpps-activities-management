import { Request, Response } from 'express'
import _ from 'lodash'
import { toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import EventTier from '../../../../enum/eventTiers'
import { AllAttendance } from '../../../../@types/activitiesAPI/types'
import { PayNoPay } from '../../../../@types/activities'

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

    // Set the default filter values if they are not set
    req.journeyData.attendanceSummaryJourney ??= {}
    req.journeyData.attendanceSummaryJourney.categoryFilters ??= uniqueCategories
    req.journeyData.attendanceSummaryJourney.absenceReasonFilters ??= absenceReasons
    req.journeyData.attendanceSummaryJourney.payFilters ??= [PayNoPay.PAID, PayNoPay.NO_PAY]

    const { categoryFilters, searchTerm, absenceReasonFilters, payFilters } = req.journeyData.attendanceSummaryJourney

    const attendancesMatchingFilter = this.filterAttendances(
      attendancesForStatus,
      categoryFilters,
      status === 'Absences',
      payFilters,
      absenceReasonFilters,
    )

    const prisonerNumbers = attendancesMatchingFilter.map(a => a.prisonerNumber)

    const inmates = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const attendees = attendancesMatchingFilter
      .map(a => ({
        inmate: inmates.find(i => i.prisonerNumber === a.prisonerNumber),
        prisonerNumber: a.prisonerNumber,
        attendance: a,
      }))
      .map(a => ({
        firstName: a.inmate.firstName,
        lastName: a.inmate.lastName,
        prisonerNumber: a.prisonerNumber,
        location: a.inmate.cellLocation,
        attendance: a.attendance,
        status: a.inmate.status,
        prisonCode: a.inmate.prisonId,
      }))
      .filter(
        a =>
          !searchTerm ||
          this.includesSearchTerm(`${a.firstName} ${a.lastName}`, searchTerm) ||
          this.includesSearchTerm(a.prisonerNumber, searchTerm),
      )

    const showRefusalsLink =
      status === 'Absences' &&
      attendees.filter(attendee => attendee.attendance.attendanceReasonCode === AttendanceReason.REFUSED).length > 0

    return res.render('pages/activities/daily-attendance-summary/attendances', {
      activityDate,
      uniqueCategories,
      absenceReasons,
      status,
      attendees,
      tier,
      showRefusalsLink,
    })
  }

  private includesSearchTerm = (propertyValue: string, searchTerm: string) =>
    !searchTerm || propertyValue.toLowerCase().includes(searchTerm.toLowerCase())

  private payFilter = (issuePayment: boolean, payFilters: PayNoPay[]) => {
    return issuePayment ? payFilters.includes(PayNoPay.PAID) : payFilters.includes(PayNoPay.NO_PAY)
  }

  private filterAttendances = (
    attendancesForStatus: AllAttendance[],
    categoryFilters: string[],
    absencesPage: boolean,
    payFilters: PayNoPay[],
    absenceReasonFilters: string | string[],
  ) => {
    let attendancesMatchingAllFilters
    const attendancesMatchingCategoryFilter = attendancesForStatus.filter(a => categoryFilters.includes(a.categoryName))
    if (absencesPage) {
      const attendancesMatchingPayFilter = attendancesMatchingCategoryFilter.filter(a =>
        this.payFilter(a.issuePayment, payFilters),
      )
      attendancesMatchingAllFilters = attendancesMatchingPayFilter.filter(a => {
        if (Array.isArray(absenceReasonFilters)) {
          return absenceReasonFilters.some(reason => reason === a.attendanceReasonCode)
        }
        return a.attendanceReasonCode === absenceReasonFilters
      })
    }
    return attendancesMatchingAllFilters || attendancesMatchingCategoryFilter
  }
}
