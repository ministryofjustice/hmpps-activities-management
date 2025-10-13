import { flattenPrisonerScheduledEvents, getPrisonerNumbersFromScheduledActivities } from './recordAttendanceUtils'
import { PrisonerScheduledEvents, ScheduledActivity } from '../../../../@types/activitiesAPI/types'

describe('recordAttendanceUtils', () => {
  describe('flattenPrisonerScheduledEvents', () => {
    it('should return all of the nested array items', () => {
      const eventsObject = {
        activities: [{ name: 'activity1' }, { name: 'activity2' }],
        appointments: [{ name: 'appointment1' }, { name: 'appointment2' }],
        courtHearings: [{ name: 'courtHearing1' }],
        visits: [{ name: 'visit1' }, { name: 'visit2' }],
        adjudications: [{ name: 'adjudication1' }],
      } as unknown as PrisonerScheduledEvents

      const result = flattenPrisonerScheduledEvents(eventsObject)

      expect(result).toEqual([
        { name: 'activity1' },
        { name: 'activity2' },
        { name: 'appointment1' },
        { name: 'appointment2' },
        { name: 'courtHearing1' },
        { name: 'visit1' },
        { name: 'visit2' },
        { name: 'adjudication1' },
      ])
    })

    it('should return all of the nested array items ignoring empty lists', () => {
      const eventsObject = {
        activities: [{ name: 'activity1' }, { name: 'activity2' }],
        appointments: [],
        courtHearings: [{ name: 'courtHearing1' }],
        visits: [],
        adjudications: [{ name: 'adjudication1' }],
      } as unknown as PrisonerScheduledEvents

      const result = flattenPrisonerScheduledEvents(eventsObject)

      expect(result).toEqual([
        { name: 'activity1' },
        { name: 'activity2' },
        { name: 'courtHearing1' },
        { name: 'adjudication1' },
      ])
    })
  })

  describe('getPrisonerNumbersFromScheduledActivities', () => {
    it('should filter the activities based on the search term - today', async () => {
      const activities = [
        {
          id: 1,
          attendances: [{ prisonerNumber: 'A1234AA' }, { prisonerNumber: 'B1234BB' }, { prisonerNumber: 'C1234CC' }],
        },
        {
          id: 2,
          attendances: [{ prisonerNumber: 'A1234AA' }, { prisonerNumber: 'D1234DD' }],
        },
        {
          id: 3,
          attendances: [{ prisonerNumber: 'E1234EE' }],
        },
      ] as unknown as ScheduledActivity[]

      const result = getPrisonerNumbersFromScheduledActivities(activities)

      expect(result).toEqual(['A1234AA', 'B1234BB', 'C1234CC', 'D1234DD', 'E1234EE'])
    })
  })
})
