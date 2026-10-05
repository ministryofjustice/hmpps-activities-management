import { ActivityScheduleSlot, ExclusionRevision, ScheduleLastChanged } from '../../@types/activitiesAPI/types'
import { buildScheduleChangeViewModel } from './scheduleChangeHistory'

describe('buildScheduleChangeViewModel', () => {
  describe('exclusion history mapping', () => {
    it('maps added exclusions to removedFromSchedule', () => {
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
      )

      expect(result.week1?.removedFromSchedule).toEqual([
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
        },
      ])
    })

    it('maps removed exclusions to addedToSchedule', () => {
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
        [
          {
            weekNumber: 1,
            timeSlot: 'AM',
            daysOfWeek: ['Mon'],
          },
        ] as ActivityScheduleSlot[],
      )

      expect(result.week1?.addedToSchedule).toEqual([
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM'],
        },
      ])
    })
  })

  describe('activity schedule history mapping', () => {
    it('maps activity schedule changes to activity events', () => {
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
      )

      expect(result.week1?.type).toBe('ACTIVITY')
    })

    it('groups added activity sessions on the same day', () => {
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
              {
                weekNumber: 1,
                dayOfWeek: 'MONDAY',
                timeSlot: 'PM',
              },
              {
                weekNumber: 1,
                dayOfWeek: 'MONDAY',
                timeSlot: 'ED',
              },
            ],
            removedSessions: [],
          },
        ] as ScheduleLastChanged[],
        [],
      )

      expect(result.week1?.addedToSchedule).toEqual([
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM', 'PM', 'ED'],
        },
      ])
    })

    it('groups removed activity sessions on the same day', () => {
      const result = buildScheduleChangeViewModel(
        null,
        [],
        [
          {
            weekNumber: 1,
            changedAt: '2026-09-15T10:30:00',
            changedBy: 'USER_1',
            addedSessions: [],
            removedSessions: [
              {
                weekNumber: 1,
                dayOfWeek: 'MONDAY',
                timeSlot: 'AM',
              },
              {
                weekNumber: 1,
                dayOfWeek: 'MONDAY',
                timeSlot: 'PM',
              },
            ],
          },
        ] as ScheduleLastChanged[],
        [],
      )

      expect(result.week1?.removedFromSchedule).toEqual([
        {
          weekNumber: 1,
          dayOfWeek: 'MONDAY',
          timeSlots: ['AM', 'PM'],
        },
      ])
    })
  })

  describe('event selection', () => {
    it('returns the latest event for a schedule week', () => {
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
      )

      expect(result.week1?.changedBy).toBe('LATEST_USER')
    })

    it('should return the latest event regardless of whether it is an activity or exclusion change', () => {
      const result = buildScheduleChangeViewModel(
        null,
        [
          {
            weekNumber: 1,
            dayOfWeek: 'MONDAY',
            timeSlots: ['AM'],
            revisionType: 'ADDED',
            revision: 1,
            updatedBy: 'EXCLUSION_USER',
            updatedDateTime: '2026-09-15T10:00:00',
          },
        ] as ExclusionRevision[],
        [
          {
            weekNumber: 1,
            changedAt: '2026-09-15T11:00:00',
            changedBy: 'ACTIVITY_USER',
            addedSessions: [
              {
                weekNumber: 1,
                dayOfWeek: 'MONDAY',
                timeSlot: 'PM',
              },
            ],
            removedSessions: [],
          },
        ] as ScheduleLastChanged[],
        [],
      )

      expect(result.week1).toEqual({
        type: 'ACTIVITY',
        weekNumber: 1,
        changedAt: '2026-09-15T11:00:00',
        changedBy: 'ACTIVITY_USER',
        addedToSchedule: [
          {
            weekNumber: 1,
            dayOfWeek: 'MONDAY',
            timeSlots: ['PM'],
          },
        ],
        removedFromSchedule: [],
      })
    })
  })

  describe('allocation time filtering', () => {
    it('excludes changes made before allocation time', () => {
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
      )

      expect(result.week1).toBeNull()
    })
  })

  describe('one-week schedule filtering', () => {
    it('filters invalid exclusion added session and preserves removedFromSchedule entries', () => {
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

    it('removes the invalid exclusion event when all added sessions are filtered and no removed sessions remain', () => {
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
      )

      expect(result.week1).toBeNull()
    })
  })

  describe('two-week schedules', () => {
    it('selects the latest event independently for each week', () => {
      const result = buildScheduleChangeViewModel(
        null,
        [
          {
            weekNumber: 1,
            dayOfWeek: 'MONDAY',
            timeSlots: ['AM'],
            revisionType: 'ADDED',
            revision: 1,
            updatedBy: 'EXCLUSION_WEEK1',
            updatedDateTime: '2026-09-10T10:00:00',
          },
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
            removedSessions: [],
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
            removedSessions: [],
          },
        ] as ScheduleLastChanged[],
        [],
      )

      expect(result.week1?.changedBy).toBe('ACTIVITY_WEEK1')
      expect(result.week2?.changedBy).toBe('ACTIVITY_WEEK2')
    })

    it('filters invalid exclusion added sessions on a two-week schedule and retains valid sessions', () => {
      const activitySlots: ActivityScheduleSlot[] = [
        {
          weekNumber: 2,
          timeSlot: 'PM',
          daysOfWeek: ['Mon'],
        },
      ] as ActivityScheduleSlot[]

      const result = buildScheduleChangeViewModel(
        null,
        [
          {
            weekNumber: 2,
            dayOfWeek: 'MONDAY',
            timeSlots: ['AM', 'PM'],
            revisionType: 'REMOVED',
            revision: 1,
            updatedBy: 'USER_1',
            updatedDateTime: '2026-09-15T10:30:00',
          },
        ] as ExclusionRevision[],
        [],
        activitySlots,
      )

      expect(result.week2).toEqual({
        type: 'EXCLUSION',
        weekNumber: 2,
        changedAt: '2026-09-15T10:30:00',
        changedBy: 'USER_1',
        addedToSchedule: [
          {
            weekNumber: 2,
            dayOfWeek: 'MONDAY',
            timeSlots: ['PM'],
          },
        ],
        removedFromSchedule: [],
      })
    })

    it('should return a week 2 event when no week 1 event exists', () => {
      const result = buildScheduleChangeViewModel(
        null,
        [
          {
            weekNumber: 2,
            dayOfWeek: 'TUESDAY',
            timeSlots: ['PM'],
            revisionType: 'ADDED',
            revision: 1,
            updatedBy: 'WEEK2_USER',
            updatedDateTime: '2026-09-15T10:00:00',
          },
        ] as ExclusionRevision[],
        [],
        [],
      )

      expect(result).toEqual({
        week1: null,
        week2: {
          type: 'EXCLUSION',
          weekNumber: 2,
          changedAt: '2026-09-15T10:00:00',
          changedBy: 'WEEK2_USER',
          addedToSchedule: [],
          removedFromSchedule: [
            {
              weekNumber: 2,
              dayOfWeek: 'TUESDAY',
              timeSlots: ['PM'],
            },
          ],
        },
      })
    })
  })
})
