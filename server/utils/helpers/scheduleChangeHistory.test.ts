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

  it('should hide exclusion removals for one week schedules when the session is not on the activity schedule', () => {
    const activitySlots: ActivityScheduleSlot[] = [
      {
        id: 1,
        weekNumber: 1,
        timeSlot: 'AM',
        startTime: '09:00',
        endTime: '11:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]

    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'SUNDAY',
          timeSlots: ['PM'],
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

  it('should retain exclusion removals for one week schedules when the session exists on the activity schedule', () => {
    const activitySlots: ActivityScheduleSlot[] = [
      {
        id: 1,
        weekNumber: 1,
        timeSlot: 'PM',
        startTime: '09:00',
        endTime: '11:00',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]

    const result = buildScheduleChangeViewModel(
      null,
      [
        {
          weekNumber: 1,
          dayOfWeek: 'TUESDAY',
          timeSlots: ['PM'],
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

    expect(result.week1.addedToSchedule).toEqual([
      {
        weekNumber: 1,
        dayOfWeek: 'TUESDAY',
        timeSlots: ['PM'],
      },
    ])
  })
})
