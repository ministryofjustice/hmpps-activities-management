import { AppointmentAttendanceSummary } from '../../../@types/activitiesAPI/types'
import EventTier from '../../../enum/eventTiers'
import { getEventTierCounts } from './attendanceUtils'

describe('getEventTierCounts', () => {
  it('should calculate the tier summaries correctly', () => {
    const summaries = [
      { eventTierType: EventTier.TIER_1, attendeeCount: 3, attendedCount: 3 },
      { eventTierType: EventTier.TIER_2, attendeeCount: 10, attendedCount: 8 },
      { eventTierType: EventTier.FOUNDATION, attendeeCount: 4, attendedCount: 0 },
      { eventTierType: EventTier.FOUNDATION, attendeeCount: 6, attendedCount: 0 },
      { eventTierType: EventTier.TIER_2, attendeeCount: 2, attendedCount: 2 },
    ] as AppointmentAttendanceSummary[]

    expect(getEventTierCounts(summaries)).toEqual({
      tier1Count: 3,
      tier2Count: 10,
      foundationCount: 0,
    })
  })
})
