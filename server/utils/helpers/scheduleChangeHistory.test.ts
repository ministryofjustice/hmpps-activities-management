import { ActivityScheduleSlot, ExclusionRevision, ScheduleLastChanged } from '../../@types/activitiesAPI/types'
import { buildScheduleChangeViewModel } from './scheduleChangeHistory'

describe('schedule change history helper function tests', () => {
  it('should map added exclusions to removedFromSchedule', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
      ] as ExclusionRevision[],
      [],
      [],
      2,
    )

    expect(result.week1.removedFromSchedule).toEqual([
      {
        weekNumber: 1,
        dayOfWeek: 'MONDAY',
        timeSlots: ['AM'],
      },
    ])
  })

  it('should map removed exclusions to addedToSchedule', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'REMOVED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
      ] as ExclusionRevision[],
      [],
      [],
      2,
    )

    expect(result.week1?.addedToSchedule).toEqual([
      {
        weekNumber: 1,
        dayOfWeek: 'MONDAY',
        timeSlots: ['AM'],
      },
    ])
  })

  it('should return the latest event for a schedule week', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'OLDER_USER',
          updatedDateTime: '2026-09-01T10:00:00',
        },
        {
          weekNumber: 1,
          dayOfWeek: 'TUESDAY',
          timeSlots: ['PM'],
          revisionType: 'ADDED',
          revision: 2,
          updatedBy: 'LATEST_USER',
          updatedDateTime: '2026-09-15T10:00:00',
        },
      ] as ExclusionRevision[],
      [],
      [],
      2,
    )

    expect(result.week1?.changedBy).toBe('LATEST_USER')
  })

  it('should exclude changes made before allocation time', () => {
    const result = buildScheduleChangeViewModel(
      '2026-09-10T00:00:00',
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'OLD_USER',
          updatedDateTime: '2026-09-10T00:00:00',
        },
      ] as ExclusionRevision[],
      [],
      [],
      2,
    )

    expect(result.week1).toBeNull()
  })

  it('should include activity schedule changes', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [],
      [
        {
          weekNumber: 1,
          changedAt: '2026-09-15T10:30:00',
          changedBy: 'USER_1',
          addedSessions: [
            {
              weekNumber: 1,
              dayOfWeek: 'MONDAY',
              timeSlot: 'AM',
            },
          ],
          removedSessions: [],
        },
      ] as ScheduleLastChanged[],
      [],
      2,
    )

    expect(result.week1?.type).toBe('ACTIVITY')
  })

  it('should remove the event when all addedToSchedule entries are filtered and no removedFromSchedule entries exist', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'REMOVED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
      ],
      [],
      [],
      1,
    )

    expect(result.week1).toBeNull()
  })

  it('should filter invalid time slots from addedToSchedule and retain valid slots', () => {
    const activitySlots: ActivityScheduleSlot[] = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['Mon'],
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['Mon'],
      },
    ] as ActivityScheduleSlot[]

    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM', 'PM', 'ED'],
          revisionType: 'REMOVED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
      ] as ExclusionRevision[],
      [],
      activitySlots,
      1,
    )

    expect(result.week1).toEqual({
      type: 'EXCLUSION',
      weekNumber: 1,
      changedAt: '2026-09-15T10:30:00',
      changedBy: 'USER_1',
      addedToSchedule: [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['PM', 'ED'],
        },
      ],
      removedFromSchedule: [],
    })
  })

  it('should remove the event when all addedToSchedule time slots are invalid', () => {
    const activitySlots: ActivityScheduleSlot[] = []

    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM', 'PM', 'ED'],
          revisionType: 'REMOVED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
      ] as ExclusionRevision[],
      [],
      activitySlots,
      1,
    )

    expect(result.week1).toBeNull()
  })

  it('should filter invalid addedToSchedule time slots and leave removedFromSchedule unchanged', () => {
    const activitySlots: ActivityScheduleSlot[] = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['Mon'],
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['Mon'],
      },
    ] as ActivityScheduleSlot[]

    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM', 'PM', 'ED'],
          revisionType: 'REMOVED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
        {
          weekNumber: 1,
          dayOfWeek: 'TUESDAY',
          timeSlots: ['PM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'USER_1',
          updatedDateTime: '2026-09-15T10:30:00',
        },
      ] as ExclusionRevision[],
      [],
      activitySlots,
      1,
    )

    expect(result.week1).toEqual({
      type: 'EXCLUSION',
      weekNumber: 1,
      changedAt: '2026-09-15T10:30:00',
      changedBy: 'USER_1',
      addedToSchedule: [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['PM', 'ED'],
        },
      ],
      removedFromSchedule: [
        {
          weekNumber: 1,
          dayOfWeek: 'TUESDAY',
          timeSlots: ['PM'],
        },
      ],
    })
  })

  it('should return the latest event for each schedule week independently', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'WEEK1_USER',
          updatedDateTime: '2026-09-15T10:00:00',
        },
        {
          weekNumber: 2,
          dayOfWeek: 'TUESDAY',
          timeSlots: ['PM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'WEEK2_USER',
          updatedDateTime: '2026-09-16T10:00:00',
        },
      ] as ExclusionRevision[],
      [],
      [],
      2,
    )

    expect(result).toEqual({
      week1: expect.objectContaining({
        weekNumber: 1,
        changedBy: 'WEEK1_USER',
      }),
      week2: expect.objectContaining({
        weekNumber: 2,
        changedBy: 'WEEK2_USER',
      }),
    })
  })

  it('should select the latest event independently for each week of a two-week schedule', () => {
    const result = buildScheduleChangeViewModel(
      null,
      [
        // Older Week 1 exclusion
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'EXCLUSION_WEEK1',
          updatedDateTime: '2026-09-10T10:00:00',
        },

        // Older Week 2 exclusion
        {
          weekNumber: 2,
          dayOfWeek: 'TUESDAY',
          timeSlots: ['PM'],
          revisionType: 'ADDED',
          revision: 1,
          updatedBy: 'EXCLUSION_WEEK2',
          updatedDateTime: '2026-09-11T10:00:00',
        },
      ] as ExclusionRevision[],
      [
        {
          weekNumber: 1,
          changedAt: '2026-09-15T10:00:00',
          changedBy: 'ACTIVITY_WEEK1',
          addedSessions: [
            {
              weekNumber: 1,
              dayOfWeek: 'THURSDAY',
              timeSlot: 'ED',
            },
          ],
          removedSessions: [
            {
              weekNumber: 1,
              dayOfWeek: 'MONDAY',
              timeSlot: 'AM',
            },
          ],
        },
        {
          weekNumber: 2,
          changedAt: '2026-09-16T10:00:00',
          changedBy: 'ACTIVITY_WEEK2',
          addedSessions: [
            {
              weekNumber: 2,
              dayOfWeek: 'FRIDAY',
              timeSlot: 'PM',
            },
          ],
          removedSessions: [
            {
              weekNumber: 2,
              dayOfWeek: 'WEDNESDAY',
              timeSlot: 'AM',
            },
          ],
        },
      ] as ScheduleLastChanged[],
      [],
      2,
    )

    expect(result.week1).toEqual({
      type: 'ACTIVITY',
      weekNumber: 1,
      changedAt: '2026-09-15T10:00:00',
      changedBy: 'ACTIVITY_WEEK1',
      addedToSchedule: [
        {
          weekNumber: 1,
          dayOfWeek: 'THURSDAY',
          timeSlots: ['ED'],
        },
      ],
      removedFromSchedule: [
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
        },
      ],
    })

    expect(result.week2).toEqual({
      type: 'ACTIVITY',
      weekNumber: 2,
      changedAt: '2026-09-16T10:00:00',
      changedBy: 'ACTIVITY_WEEK2',
      addedToSchedule: [
        {
          weekNumber: 2,
          dayOfWeek: 'FRIDAY',
          timeSlots: ['PM'],
        },
      ],
      removedFromSchedule: [
        {
          weekNumber: 2,
          dayOfWeek: 'WEDNESDAY',
          timeSlots: ['AM'],
        },
      ],
    })
  })
})
