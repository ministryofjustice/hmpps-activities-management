import { AppointmentAttendanceSummary } from '../../../@types/activitiesAPI/types'
import EventTier from '../../../enum/eventTiers'

const getAttendanceSummary = (summaries: AppointmentAttendanceSummary[]) => {
  const tierCounts = getEventTierCounts(summaries)
  const attendanceSummary = {
    attendeeCount: summaries.map(s => s.attendeeCount).reduce((sum, count) => sum + count, 0),
    attended: summaries.map(s => s.attendedCount).reduce((sum, count) => sum + count, 0),
    notAttended: summaries.map(s => s.nonAttendedCount).reduce((sum, count) => sum + count, 0),
    notRecorded: summaries.map(s => s.notRecordedCount).reduce((sum, count) => sum + count, 0),
    attendedPercentage: 0,
    notAttendedPercentage: 0,
    notRecordedPercentage: 0,
    ...tierCounts,
  }

  if (attendanceSummary.attendeeCount > 0) {
    attendanceSummary.attendedPercentage = Math.round(
      (attendanceSummary.attended / attendanceSummary.attendeeCount) * 100,
    )
    attendanceSummary.notAttendedPercentage = Math.round(
      (attendanceSummary.notAttended / attendanceSummary.attendeeCount) * 100,
    )
    attendanceSummary.notRecordedPercentage = Math.round(
      (attendanceSummary.notRecorded / attendanceSummary.attendeeCount) * 100,
    )
  }

  return attendanceSummary
}

const getEventTierCounts = (summaries: AppointmentAttendanceSummary[]) => {
  const tier1 = summaries.filter(s => s.eventTierType === EventTier.TIER_1)
  const tier2 = summaries.filter(s => s.eventTierType === EventTier.TIER_2)
  const foundation = summaries.filter(s => s.eventTierType === EventTier.FOUNDATION)

  const attendedTier1 = tier1.map(summary => summary.attendedCount).reduce((sum, count) => sum + count, 0)
  const attendedTier2 = tier2.map(summary => summary.attendedCount).reduce((sum, count) => sum + count, 0)
  const attendedFoundation = foundation.map(summary => summary.attendedCount).reduce((sum, count) => sum + count, 0)

  const totalAttendeesTier1 = tier1.map(summary => summary.attendeeCount).reduce((sum, count) => sum + count, 0)
  const totalAttendeesTier2 = tier2.map(summary => summary.attendeeCount).reduce((sum, count) => sum + count, 0)
  const totalAttendeesFoundation = foundation
    .map(summary => summary.attendeeCount)
    .reduce((sum, count) => sum + count, 0)

  return {
    tier1Count: attendedTier1,
    tier2Count: attendedTier2,
    foundationCount: attendedFoundation,
    tier1Percentage: attendedTier1 > 0 ? Math.round((attendedTier1 / totalAttendeesTier1) * 100) : 0,
    tier2Percentage: attendedTier2 > 0 ? Math.round((attendedTier2 / totalAttendeesTier2) * 100) : 0,
    foundationalPercentage:
      attendedFoundation > 0 ? Math.round((attendedFoundation / totalAttendeesFoundation) * 100) : 0,
  }
}

export default getAttendanceSummary
