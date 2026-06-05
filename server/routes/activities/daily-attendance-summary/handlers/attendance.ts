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
import { filterAttendancesByActivityType } from '../utils/utils'

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
    req.journeyData.attendanceSummaryJourney.activityTypeFilters ??= ['inPrison', 'outsidePrison', 'outsideEmployer']
    req.journeyData.attendanceSummaryJourney.absenceReasonFilters ??= absenceReasons
    req.journeyData.attendanceSummaryJourney.payFilters ??= [PayNoPay.PAID, PayNoPay.NO_PAY]

    const { categoryFilters, searchTerm, absenceReasonFilters, payFilters, activityTypeFilters } =
      req.journeyData.attendanceSummaryJourney

    const attendancesMatchingFilter = this.filterAttendances(
      attendancesForStatus,
      categoryFilters,
      user.externalActivitiesRolledOut ? activityTypeFilters : ['inPrison', 'outsidePrison', 'outsideEmployer'],
      status === 'Absences',
      payFilters,
      absenceReasonFilters,
    )

    const prisonerNumbers = attendancesMatchingFilter.map(a => a.prisonerNumber)

    const inmates = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const attendees = attendancesMatchingFilter
      .map(attendance => {
        const selectedInmate = inmates.find(inmate => inmate.prisonerNumber === attendance.prisonerNumber)
        return {
          firstName: selectedInmate?.firstName,
          lastName: selectedInmate?.lastName,
          prisonerNumber: attendance.prisonerNumber,
          location: selectedInmate?.cellLocation,
          attendance,
          status: selectedInmate?.status,
          prisonCode: selectedInmate?.prisonId,
        }
      })
      .filter(
        attendee =>
          !searchTerm ||
          this.includesSearchTerm(`${attendee.firstName} ${attendee.lastName}`, searchTerm) ||
          this.includesSearchTerm(attendee.prisonerNumber, searchTerm),
      )

    const showRefusalsLink =
      status === 'Absences' &&
      attendees.filter(attendee => attendee.attendance.attendanceReasonCode === AttendanceReason.REFUSED).length > 0

    res.locals.attendanceSummaryJourney = req.journeyData.attendanceSummaryJourney
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
    activityTypeFilters: string[],
    absencesPage: boolean,
    payFilters: PayNoPay[],
    absenceReasonFilters: string | string[],
  ) => {
    let attendancesMatchingAllFilters
    let attendancesMatchingCategoryFilter = attendancesForStatus.filter(a => categoryFilters.includes(a.categoryName))
    if (!absencesPage) {
      attendancesMatchingCategoryFilter = filterAttendancesByActivityType(
        attendancesMatchingCategoryFilter,
        activityTypeFilters,
      )
    }
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
