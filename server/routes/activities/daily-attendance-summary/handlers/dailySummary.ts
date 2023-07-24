import { Request, Response } from 'express'
import _ from 'lodash'
import { getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import cancellationReasons from '../../record-attendance/cancellationReasons'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import TimeSlot from '../../../../enum/timeSlot'
import { AllAttendanceSummary } from '../../../../@types/activitiesAPI/types'
import { ServiceUser } from '../../../../@types/express'

type CancelledActivity = {
  id: number
  category: string
  timeSlot: TimeSlot
  cancelledReason: string
}

export default class DailySummaryRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date } = req.query

    if (!date) {
      return res.redirect('select-period')
    }

    const activityDate = toDate(req.query.date as string)

    const attendanceSummary = await this.activitiesService.getAllAttendanceSummary(activityDate, user)
    const uniqueCategories = _.uniq(attendanceSummary.map(c => c.categoryName))

    // Set the default filter values if they are not set
    req.session.attendanceSummaryJourney ??= {}
    req.session.attendanceSummaryJourney.categoryFilters ??= uniqueCategories

    const { categoryFilters } = req.session.attendanceSummaryJourney

    const cancelledSessionsForFilters = await this.getCancelledActivitiesAtPrison(activityDate, user).then(r =>
      r.filter(a => categoryFilters.includes(a.category)),
    )
    const attendanceSummaryForFilters = attendanceSummary.filter(a => categoryFilters.includes(a.categoryName))

    return res.render('pages/activities/daily-attendance-summary/daily-summary', {
      activityDate,
      uniqueCategories,
      ...this.getCancelledActivitySummary(cancelledSessionsForFilters),
      ...this.getDailyAttendanceSummary(attendanceSummaryForFilters),
      ...this.getSuspendedPrisonerCount(attendanceSummaryForFilters),
    })
  }

  private getCancelledActivitySummary = (cancelledEvents: CancelledActivity[]) => {
    const totalCancelledSessions = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalStaffUnavailable = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalStaffTraining = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalActivityNotRequired = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalLocationUnavailable = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalOperationalIssue = { DAY: 0, AM: 0, PM: 0, ED: 0 }

    cancelledEvents.forEach(activity => {
      totalCancelledSessions.DAY += 1
      totalCancelledSessions[activity.timeSlot.toUpperCase()] += 1
      if (activity.cancelledReason === cancellationReasons.STAFF_UNAVAILABLE) {
        totalStaffUnavailable.DAY += 1
        totalStaffUnavailable[activity.timeSlot.toUpperCase()] += 1
      } else if (activity.cancelledReason === cancellationReasons.STAFF_TRAINING) {
        totalStaffTraining.DAY += 1
        totalStaffTraining[activity.timeSlot.toUpperCase()] += 1
      } else if (activity.cancelledReason === cancellationReasons.NOT_REQUIRED) {
        totalActivityNotRequired.DAY += 1
        totalActivityNotRequired[activity.timeSlot.toUpperCase()] += 1
      } else if (activity.cancelledReason === cancellationReasons.LOCATION_UNAVAILABLE) {
        totalLocationUnavailable.DAY += 1
        totalLocationUnavailable[activity.timeSlot.toUpperCase()] += 1
      } else if (activity.cancelledReason === cancellationReasons.OPERATIONAL_ISSUE) {
        totalOperationalIssue.DAY += 1
        totalOperationalIssue[activity.timeSlot.toUpperCase()] += 1
      }
    })

    return {
      totalCancelledSessions,
      totalStaffUnavailable,
      totalStaffTraining,
      totalActivityNotRequired,
      totalLocationUnavailable,
      totalOperationalIssue,
    }
  }

  private getDailyAttendanceSummary = (attendanceSummary: AllAttendanceSummary[]) => {
    const totalActivities = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalAllocated = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalNotAttended = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalAbsences = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalAttended = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalPaidAbsences = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnPaidAbsences = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalCancelled = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalPaidSick = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalNotRequired = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalPaidRest = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalClash = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalPaidOther = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnpaidSick = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalRefused = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnpaidRest = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnpaidOther = { DAY: 0, AM: 0, PM: 0, ED: 0 }

    attendanceSummary.forEach(attendance => {
      totalActivities.DAY += 1
      totalActivities[attendance.timeSlot] += 1
      totalAllocated.DAY += attendance.attendanceCount
      totalAllocated[attendance.timeSlot] += attendance.attendanceCount
      if (attendance.status === AttendanceStatus.WAITING) {
        totalNotAttended.DAY += attendance.attendanceCount
        totalNotAttended[attendance.timeSlot] += attendance.attendanceCount
      } else if (attendance.attendanceReasonCode !== AttendanceReason.ATTENDED) {
        totalAbsences.DAY += attendance.attendanceCount
        totalAbsences[attendance.timeSlot] += attendance.attendanceCount
        if (attendance.issuePayment) {
          totalPaidAbsences.DAY += attendance.attendanceCount
          totalPaidAbsences[attendance.timeSlot] += attendance.attendanceCount
          if (attendance.attendanceReasonCode === AttendanceReason.CANCELLED) {
            totalCancelled.DAY += attendance.attendanceCount
            totalCancelled[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.SICK) {
            totalPaidSick.DAY += attendance.attendanceCount
            totalPaidSick[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.NOT_REQUIRED) {
            totalNotRequired.DAY += attendance.attendanceCount
            totalNotRequired[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.REST) {
            totalPaidRest.DAY += attendance.attendanceCount
            totalPaidRest[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.CLASH) {
            totalClash.DAY += attendance.attendanceCount
            totalClash[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.OTHER) {
            totalPaidOther.DAY += attendance.attendanceCount
            totalPaidOther[attendance.timeSlot] += attendance.attendanceCount
          }
        } else {
          totalUnPaidAbsences.DAY += attendance.attendanceCount
          totalUnPaidAbsences[attendance.timeSlot] += attendance.attendanceCount
          if (attendance.attendanceReasonCode === AttendanceReason.SICK) {
            totalUnpaidSick.DAY += attendance.attendanceCount
            totalUnpaidSick[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.REFUSED) {
            totalRefused.DAY += attendance.attendanceCount
            totalRefused[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.REST) {
            totalUnpaidRest.DAY += attendance.attendanceCount
            totalUnpaidRest[attendance.timeSlot] += attendance.attendanceCount
          }
          if (attendance.attendanceReasonCode === AttendanceReason.OTHER) {
            totalUnpaidOther.DAY += attendance.attendanceCount
            totalUnpaidOther[attendance.timeSlot] += attendance.attendanceCount
          }
        }
      } else {
        totalAttended.DAY += attendance.attendanceCount
        totalAttended[attendance.timeSlot] += attendance.attendanceCount
      }
    })

    return {
      totalActivities,
      totalAllocated,
      totalNotAttended,
      totalAbsences,
      totalAttended,
      totalPaidAbsences,
      totalUnPaidAbsences,
      totalCancelled,
      totalPaidSick,
      totalNotRequired,
      totalPaidRest,
      totalClash,
      totalPaidOther,
      totalUnpaidSick,
      totalRefused,
      totalUnpaidRest,
      totalUnpaidOther,
    }
  }

  private getSuspendedPrisonerCount = (attendanceSummary: AllAttendanceSummary[]) => {
    const suspendedPrisoners = attendanceSummary.filter(a => a.attendanceReasonCode === AttendanceReason.SUSPENDED)

    const suspendedPrisonerCount = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    suspendedPrisoners.forEach(attendance => {
      suspendedPrisonerCount.DAY += 1
      suspendedPrisonerCount[attendance.timeSlot.toUpperCase()] += attendance.attendanceCount
    })

    return {
      suspendedPrisonerCount,
    }
  }

  private getCancelledActivitiesAtPrison = (activityDate: Date, user: ServiceUser): Promise<CancelledActivity[]> => {
    return this.activitiesService
      .getScheduledActivitiesAtPrison(activityDate, user)
      .then(scheduledActivities => scheduledActivities.filter(a => a.cancelled))
      .then(cancelledActivities =>
        cancelledActivities.map(a => ({
          id: a.id,
          category: a.activitySchedule.activity.category.name,
          timeSlot: getTimeSlotFromTime(a.startTime),
          cancelledReason: a.cancelledReason,
        })),
      )
  }
}
