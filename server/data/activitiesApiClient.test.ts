import nock from 'nock'

import { parse } from 'date-fns'
import config from '../config'
import ActivitiesApiClient from './activitiesApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import { Allocation, LocationGroup, PrisonerAllocations } from '../@types/activitiesAPI/types'
import TimeSlot from '../enum/timeSlot'

const user = { token: 'token' } as ServiceUser

jest.mock('./tokenStore')

describe('activitiesApiClient', () => {
  let fakeActivitiesApi: nock.Scope
  let activitiesApiClient: ActivitiesApiClient

  beforeEach(() => {
    fakeActivitiesApi = nock(config.apis.activitiesApi.url)
    activitiesApiClient = new ActivitiesApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getActivityCategories', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activity-categories').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivityCategories(user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getCategoryCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/prison/MDI/activity-categories/1/capacity')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getCategoryCapacity('MDI', 1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitiesInCategory', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/prison/MDI/activity-categories/1/activities')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getActivitiesInCategory('MDI', 1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivityCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activities/1/capacity').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivityCapacity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getSchedulesOfActivity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activities/1/schedules').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getSchedulesOfActivity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitySchedule', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/schedules/1').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivitySchedule(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getScheduleCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/schedules/1/capacity').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getScheduleCapacity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getScheduledActivitiesAtPrison', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/prisons/MDI/scheduled-instances')
        .query({ startDate: '2022-08-01', endDate: '2022-08-01', slot: 'am' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getScheduledActivitiesAtPrison(
        'MDI',
        parse('2022-08-01', 'yyyy-MM-dd', new Date()),
        parse('2022-08-01', 'yyyy-MM-dd', new Date()),
        TimeSlot.AM,
        user,
      )

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getScheduledActivity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/scheduled-instances/1').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await activitiesApiClient.getScheduledActivity(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchActivityLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/prison/MDI/locations')
        .query({ date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getScheduledPrisonLocations('MDI', '2022-08-01', 'AM', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitiesAtLocation', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/prison/MDI/schedules')
        .query({ locationId: 'LOC', date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getActivitySchedules('MDI', 'LOC', '2022-08-01', 'AM', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getRolloutPrison', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/rollout/MDI').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getRolloutPrison('MDI', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAttendances', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/scheduled-instances/123/attendances')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAttendances(123, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPrisonLocationGroups', () => {
    it('should return data from api', async () => {
      const response = [
        {
          name: 'Houseblock 1',
          key: 'Houseblock 1',
          children: [],
        },
      ] as LocationGroup[]

      fakeActivitiesApi
        .get('/prisons/MDI/location-groups')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonLocationGroups('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAllocations', () => {
    it('should return data from api', async () => {
      const response = [
        {
          id: 1,
          prisonerNumber: '1234567',
        },
      ] as Allocation[]

      fakeActivitiesApi
        .get('/schedules/1/allocations')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAllocations(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPrisonerAllocations', () => {
    it('should return data from api', async () => {
      const response = [
        {
          prisonerNumber: '1234567',
          allocations: [
            {
              id: 1,
              prisonerNumber: '1234567',
            },
          ],
        },
      ] as PrisonerAllocations[]

      fakeActivitiesApi
        .post('/prisons/MDI/prisoner-allocations')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonerAllocations('MDI', ['1234567'], user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
