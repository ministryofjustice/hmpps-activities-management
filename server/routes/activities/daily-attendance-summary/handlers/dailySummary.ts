import { Request, Response } from 'express'
import _ from 'lodash'
import { getTimeSlotFromTime, toDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import cancellationReasons from '../../record-attendance/cancellationReasons'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import TimeSlot from '../../../../enum/timeSlot'
import { AllAttendance } from '../../../../@types/activitiesAPI/types'
import { ServiceUser } from '../../../../@types/express'
import EventTier from '../../../../enum/eventTiers'

type CancelledActivity = {
  id: number
  category: string
  timeSlot: TimeSlot
  cancelledReason: string
  activityId: number
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

    const allAttendances = await this.activitiesService.getAllAttendance(activityDate, user)
    const uniqueCategories = _.uniq(allAttendances.map(c => c.categoryName))

    // Set the default filter values if they are not set
    req.session.attendanceSummaryJourney ??= {}
    req.session.attendanceSummaryJourney.categoryFilters ??= uniqueCategories

    const { categoryFilters } = req.session.attendanceSummaryJourney

    const cancelledSessionsForFilters = await this.getCancelledActivitiesAtPrison(activityDate, user).then(r =>
      r.filter(a => categoryFilters.includes(a.category)),
    )
    const attendancesForFilters = allAttendances.filter(a => categoryFilters.includes(a.categoryName))

    return res.render('pages/activities/daily-attendance-summary/daily-summary', {
      activityDate,
      uniqueCategories,
      ...this.getCancelledActivitySummary(attendancesForFilters, cancelledSessionsForFilters),
      ...this.getDailyAttendanceSummary(attendancesForFilters),
      ...this.getSuspendedPrisonerCount(attendancesForFilters),
    })
  }

  private getCancelledActivitySummary = (allAttendances: AllAttendance[], cancelledEvents: CancelledActivity[]) => {
    const totalCancelledSessions = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnattendedCancelledSessions = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalStaffUnavailable = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalStaffTraining = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalActivityNotRequired = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalLocationUnavailable = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalOperationalIssue = { DAY: 0, AM: 0, PM: 0, ED: 0 }

    cancelledEvents.forEach(activity => {
      const isUnattended = allAttendances.some(
        a => a.activityId === activity.activityId && a.attendanceRequired === false,
      )

      if (isUnattended) {
        totalUnattendedCancelledSessions.DAY += 1
        totalUnattendedCancelledSessions[activity.timeSlot.toUpperCase()] += 1
        return
      }

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
      totalUnattendedCancelledSessions,
    }
  }

  private getDailyAttendanceSummary = (attendances: AllAttendance[]) => {
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
    const totalUnpaidSuspended = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalRefused = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnpaidRest = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnpaidOther = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnattendedActivities = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalUnattendedAllocated = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalAttendedTier1Activities = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalAttendedTier2Activities = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    const totalAttendedRoutineActivities = { DAY: 0, AM: 0, PM: 0, ED: 0 }

    _.uniqBy(attendances, 'scheduledInstanceId')
      .map(s => ({
        scheduledInstanceId: s.scheduledInstanceId,
        timeSlot: s.timeSlot,
        attendanceRequired: s.attendanceRequired,
      }))
      .forEach(a => {
        if (a.attendanceRequired) {
          totalActivities.DAY += 1
          totalActivities[a.timeSlot] += 1
        } else {
          totalUnattendedActivities.DAY += 1
          totalUnattendedActivities[a.timeSlot] += 1
        }
      })

    attendances.forEach(attendance => {
      if (!attendance.attendanceRequired) {
        totalUnattendedAllocated.DAY += 1
        totalUnattendedAllocated[attendance.timeSlot] += 1
        return
      }
      totalAllocated.DAY += 1
      totalAllocated[attendance.timeSlot] += 1

      if (attendance.status === AttendanceStatus.WAITING) {
        totalNotAttended.DAY += 1
        totalNotAttended[attendance.timeSlot] += 1
      } else if (attendance.attendanceReasonCode !== AttendanceReason.ATTENDED) {
        totalAbsences.DAY += 1
        totalAbsences[attendance.timeSlot] += 1
        if (attendance.issuePayment) {
          totalPaidAbsences.DAY += 1
          totalPaidAbsences[attendance.timeSlot] += 1
          if (attendance.attendanceReasonCode === AttendanceReason.CANCELLED) {
            totalCancelled.DAY += 1
            totalCancelled[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.SICK) {
            totalPaidSick.DAY += 1
            totalPaidSick[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.NOT_REQUIRED) {
            totalNotRequired.DAY += 1
            totalNotRequired[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.REST) {
            totalPaidRest.DAY += 1
            totalPaidRest[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.CLASH) {
            totalClash.DAY += 1
            totalClash[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.OTHER) {
            totalPaidOther.DAY += 1
            totalPaidOther[attendance.timeSlot] += 1
          }
        } else {
          totalUnPaidAbsences.DAY += 1
          totalUnPaidAbsences[attendance.timeSlot] += 1
          if (attendance.attendanceReasonCode === AttendanceReason.SICK) {
            totalUnpaidSick.DAY += 1
            totalUnpaidSick[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.REFUSED) {
            totalRefused.DAY += 1
            totalRefused[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.REST) {
            totalUnpaidRest.DAY += 1
            totalUnpaidRest[attendance.timeSlot] += 1
          }
          if (
            attendance.attendanceReasonCode === AttendanceReason.SUSPENDED ||
            attendance.attendanceReasonCode === AttendanceReason.AUTO_SUSPENDED
          ) {
            totalUnpaidSuspended.DAY += 1
            totalUnpaidSuspended[attendance.timeSlot] += 1
          }
          if (attendance.attendanceReasonCode === AttendanceReason.OTHER) {
            totalUnpaidOther.DAY += 1
            totalUnpaidOther[attendance.timeSlot] += 1
          }
        }
      } else {
        totalAttended.DAY += 1
        totalAttended[attendance.timeSlot] += 1

        if (attendance.eventTier === EventTier.TIER_1) {
          totalAttendedTier1Activities.DAY += 1
          totalAttendedTier1Activities[attendance.timeSlot] += 1
        } else if (attendance.eventTier === EventTier.TIER_2) {
          totalAttendedTier2Activities.DAY += 1
          totalAttendedTier2Activities[attendance.timeSlot] += 1
        } else if (attendance.eventTier === EventTier.FOUNDATION) {
          totalAttendedRoutineActivities.DAY += 1
          totalAttendedRoutineActivities[attendance.timeSlot] += 1
        }
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
      totalUnpaidSuspended,
      totalRefused,
      totalUnpaidRest,
      totalUnpaidOther,
      totalUnattendedActivities,
      totalUnattendedAllocated,
      totalAttendedTier1Activities,
      totalAttendedTier2Activities,
      totalAttendedRoutineActivities,
    }
  }

  private getSuspendedPrisonerCount = (attendances: AllAttendance[]) => {
    const suspendedPrisoners = _.uniqWith(
      attendances.filter(
        a =>
          a.attendanceReasonCode === AttendanceReason.SUSPENDED ||
          a.attendanceReasonCode === AttendanceReason.AUTO_SUSPENDED,
      ),
      (a, b) => a.prisonerNumber === b.prisonerNumber && a.timeSlot === b.timeSlot,
    )

    const suspendedPrisonerCount = { DAY: 0, AM: 0, PM: 0, ED: 0 }
    suspendedPrisonerCount.DAY = _.uniqBy(suspendedPrisoners, 'prisonerNumber').length
    suspendedPrisoners.forEach(attendance => {
      suspendedPrisonerCount[attendance.timeSlot.toUpperCase()] += 1
    })

    return {
      suspendedPrisonerCount,
    }
  }

  private getCancelledActivitiesAtPrison = (activityDate: Date, user: ServiceUser): Promise<CancelledActivity[]> => {
    const scheduledActivitiesPromise = this.activitiesService.getCancelledScheduledActivitiesAtPrison(
      activityDate,
      user,
    )

    return scheduledActivitiesPromise.then(cancelledActivities =>
      cancelledActivities.map(a => ({
        id: a.id,
        category: a.activitySchedule.activity.category.name,
        timeSlot: getTimeSlotFromTime(a.startTime),
        cancelledReason: a.cancelledReason,
        activityId: a.activitySchedule.activity.id,
      })),
    )
  }
}
