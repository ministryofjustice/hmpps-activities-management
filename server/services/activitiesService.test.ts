import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesService from './activitiesService'
import { ServiceUser } from '../@types/express'
import {
  Activity,
  ActivityCategory,
  ActivityCreateRequest,
  ActivityLite,
  ActivityScheduleLite,
  LocationGroup,
  RolloutPrison,
  ScheduledActivity,
} from '../@types/activitiesAPI/types'
import activityLocations from './fixtures/activity_locations_am_1.json'
import activitySchedules from './fixtures/activity_schedules_1.json'
import activitySchedule1 from './fixtures/activity_schedule_1.json'
import prisoners from './fixtures/prisoners_1.json'
import activityScheduleAllocation from './fixtures/activity_schedule_allocation_1.json'
import TimeSlot from '../enum/timeSlot'

jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

describe('Activities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  const user = { activeCaseLoadId: 'MDI' } as ServiceUser

  const mockedLocationGroups = [
    {
      name: 'Houseblock 1',
      key: 'Houseblock 1',
      children: [],
    },
  ] as LocationGroup[]

  describe('getActivity', () => {
    it('should get the activity from activities API', async () => {
      const expectedResult = { id: 1, description: 'Induction' } as Activity

      activitiesApiClient.getActivity.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivity(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivity).toHaveBeenCalledWith(1, user)
    })
  })

  describe('getActivityCategories', () => {
    it('should get the list of activity categories from activities API', async () => {
      const expectedResult = [{ id: 1, description: 'Induction' }] as ActivityCategory[]

      activitiesApiClient.getActivityCategories.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivityCategories(user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivityCategories).toHaveBeenCalledWith(user)
    })
  })

  describe('getActivitiesInCategory', () => {
    it('should get the list of activities from activities API', async () => {
      const expectedResult = [{ id: 1, summary: 'Maths level 1' }] as ActivityLite[]

      activitiesApiClient.getActivitiesInCategory.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivitiesInCategory(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivitiesInCategory).toHaveBeenCalledWith('MDI', 1, user)
    })
  })

  describe('getActivities', () => {
    it('should get the list of activities from activities API', async () => {
      const expectedResult = [{ id: 1, summary: 'Maths level 1' }] as ActivityLite[]

      activitiesApiClient.getActivities.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivities(user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivities).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getSchedulesOfActivity', () => {
    it('should get the list of schedules from activities API', async () => {
      const expectedResult = [{ id: 1, description: 'Houseblock 1 AM' }] as ActivityScheduleLite[]

      activitiesApiClient.getSchedulesOfActivity.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getSchedulesOfActivity(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getSchedulesOfActivity).toHaveBeenCalledWith(1, user)
    })
  })

  describe('createActivity', () => {
    it('should call activities API client to create an activity', async () => {
      await activitiesService.createActivity({ prisonCode: 'MDI' } as ActivityCreateRequest, user)
      expect(activitiesApiClient.postActivityCreation).toHaveBeenCalledWith({ prisonCode: 'MDI' }, user)
    })
  })

  describe('allocateToSchedule', () => {
    it('should call activities API client to post an allocation', async () => {
      await activitiesService.allocateToSchedule(1, 'ABC123', 'A', user)
      expect(activitiesApiClient.postAllocation).toHaveBeenCalledWith(1, 'ABC123', 'A', user)
    })
  })

  describe('getScheduledActivitiesAtPrison', () => {
    it('should get the list activities scheduled at a prison between a date range', async () => {
      const expectedResult = [{ id: 1 }] as ScheduledActivity[]
      const date = new Date()

      activitiesApiClient.getScheduledActivitiesAtPrison.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getScheduledActivitiesAtPrison(date, date, TimeSlot.AM, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getScheduledActivitiesAtPrison).toHaveBeenCalledWith(
        'MDI',
        date,
        date,
        TimeSlot.AM,
        user,
      )
    })
  })

  describe('getScheduledActivity', () => {
    it('should get the scheduled activitu by ID', async () => {
      const expectedResult = { id: 1 } as ScheduledActivity

      activitiesApiClient.getScheduledActivity.mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getScheduledActivity(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getScheduledActivity).toHaveBeenCalledWith(1, user)
    })
  })

  describe('getPrison', () => {
    it('should get rollout prison information from activities API', async () => {
      const expectedResult = { id: 1, code: 'MDI', description: 'Moorlands', active: true } as RolloutPrison
      when(activitiesApiClient.getRolloutPrison).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)
      const actualResult = await activitiesService.getPrison('MDI', user)
      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getRolloutPrison).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('populateUserPrisonInfo', () => {
    it('should add the prisons rollout status to the users caseload info API', async () => {
      const rolloutPrisonResult = { id: 1, code: 'MDI', description: 'Moorlands', active: true } as RolloutPrison
      when(activitiesApiClient.getRolloutPrison).calledWith(atLeast('MDI')).mockResolvedValue(rolloutPrisonResult)

      const testUser = {
        allCaseLoads: [
          {
            caseLoadId: 'MDI',
            caseloadFunction: 'ADMIN',
            currentlyActive: true,
            description: 'Moorlands',
            type: 'APP',
          },
        ],
      } as ServiceUser

      const actualResult = await activitiesService.populateUserPrisonInfo(testUser)

      const expectedResult = {
        allCaseLoads: [
          {
            caseLoadId: 'MDI',
            caseloadFunction: 'ADMIN',
            currentlyActive: true,
            description: 'Moorlands',
            type: 'APP',
            isRolledOut: true,
          },
        ],
      } as ServiceUser
      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getRolloutPrison).toHaveBeenCalledWith('MDI', testUser)
    })
  })

  describe('getScheduledPrisonLocations', () => {
    it('should fetch internal prison locations that have activities scheduled using the activities API', async () => {
      when(activitiesApiClient.getScheduledPrisonLocations)
        .calledWith(atLeast('10001'))
        .mockResolvedValue(activityLocations)
      const locations = await activitiesService.getScheduledPrisonLocations('EDI', '10001', '2022-08-01', user)
      expect(locations.length).toEqual(41)
      expect(activitiesApiClient.getScheduledPrisonLocations).toHaveBeenCalledWith('EDI', '10001', '2022-08-01', user)
    })
  })

  describe('getActivitySchedules', () => {
    it('should fetch activity schedules using the activities API', async () => {
      const criteria = { prisonerNumbers: ['G4793VF'] }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(prisonerSearchApiClient.searchByPrisonerNumbers).calledWith(criteria, user).mockResolvedValue(prisoners)

      when(activitiesApiClient.getActivitySchedules)
        .calledWith(atLeast('10001'))
        .mockResolvedValueOnce(activitySchedules)

      when(activitiesApiClient.getActivitySchedules).calledWith(atLeast('10001')).mockResolvedValueOnce([])

      const results = await activitiesService.getActivitySchedules('MDI', '10001', '2022-08-01', 'AM', user)

      expect(results.length).toEqual(1)
      expect(activitiesApiClient.getActivitySchedules).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', user)
      expect(results[0]).toEqual(activityScheduleAllocation[1])
    })
  })

  describe('getActivitySchedule', () => {
    it('should fetch activity schedule by id using the activities API', async () => {
      when(activitiesApiClient.getActivitySchedule).calledWith(atLeast(1)).mockResolvedValueOnce(activitySchedule1)
      const result = await activitiesService.getActivitySchedule(1, user)
      expect(activitiesApiClient.getActivitySchedule).toHaveBeenCalledWith(1, user)
      expect(result).toEqual(activitySchedule1)
    })
  })

  describe('getLocationGroups', () => {
    it('should fetch the location groups for a prison using the activities API', async () => {
      when(activitiesApiClient.getPrisonLocationGroups)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce(mockedLocationGroups)

      const results = await activitiesService.getLocationGroups('MDI', user)

      expect(results.length).toEqual(1)
      expect(results[0]).toEqual(mockedLocationGroups[0])
      expect(activitiesApiClient.getPrisonLocationGroups).toHaveBeenCalledWith('MDI', user)
    })
  })
})
