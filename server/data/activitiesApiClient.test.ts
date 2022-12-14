import nock from 'nock'

import { parse } from 'date-fns'
import config from '../config'
import ActivitiesApiClient from './activitiesApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import {
  ActivityCreateRequest,
  Allocation,
  LocationGroup,
  LocationPrefix,
  PrisonerAllocations,
  PrisonerScheduledEvents,
} from '../@types/activitiesAPI/types'
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

  describe('getActivity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activities/1').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
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

  describe('getActivities', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/prison/MDI/activities').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivities('MDI', user)
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

  describe('postActivityCreation', () => {
    it('should post data to api', async () => {
      fakeActivitiesApi
        .post('/activities', {
          prisonCode: 'MDI',
          summary: 'Maths level 1',
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(200)

      await activitiesApiClient.postActivityCreation(
        { prisonCode: 'MDI', summary: 'Maths level 1' } as ActivityCreateRequest,
        user,
      )

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postAllocation', () => {
    it('should post data to api', async () => {
      fakeActivitiesApi
        .post('/schedules/1/allocations', {
          prisonerNumber: 'ABC123',
          payBand: 'B',
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(204)

      await activitiesApiClient.postAllocation(1, 'ABC123', 'B', user)

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
        .get('/locations/prison/MDI/location-groups')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonLocationGroups('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPrisonLocationPrefixByGroup', () => {
    it('should return data from api', async () => {
      const response = { locationPrefix: 'MDI-1-' } as LocationPrefix

      fakeActivitiesApi
        .get('/locations/prison/MDI/location-prefix')
        .query({ groupName: 'Houseblock 1' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonLocationPrefixByGroup('MDI', 'Houseblock 1', user)

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

  describe('GET getScheduledEvents', () => {
    const prisonCode = 'MDI'
    const prisonerNumber = 'A1234AA'
    const startDate = '2022-10-01'
    const endDate = '2022-10-02'

    it('should return scheduled events for a single prisoner and a date range', async () => {
      const response = {
        prisonCode,
        prisonerNumbers: [prisonerNumber],
        startDate,
        endDate,
        appointments: [],
        activities: [],
        visits: [],
        courtHearings: [],
      } as PrisonerScheduledEvents

      fakeActivitiesApi
        .get(`/scheduled-events/prison/${prisonCode}`)
        .query({ prisonerNumber, startDate, endDate })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const result = await activitiesApiClient.getScheduledEvents(prisonCode, prisonerNumber, startDate, endDate, user)

      expect(result).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('POST getScheduledEventsByPrisonerNumbers', () => {
    const prisonCode = 'MDI'
    const prisonerNumbers = ['A1234AA', 'B1234BB']
    const date = '2022-10-01'
    const timeSlot = 'AM'

    it('should return scheduled events for a list of prisoners and single date / time slot', async () => {
      const response = {
        prisonCode,
        prisonerNumbers,
        startDate: date,
        endDate: date,
        appointments: [],
        activities: [],
        visits: [],
        courtHearings: [],
      } as PrisonerScheduledEvents

      fakeActivitiesApi
        .post(`/scheduled-events/prison/${prisonCode}`, prisonerNumbers)
        .query({ date, timeSlot })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const result = await activitiesApiClient.getScheduledEventsByPrisonerNumbers(
        prisonCode,
        date,
        timeSlot,
        prisonerNumbers,
        user,
      )

      expect(result).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
