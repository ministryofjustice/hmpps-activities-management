import nock from 'nock'

import config from '../config'
import ActivitiesApiClient from './activitiesApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'

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
        .get('/schedules/MDI')
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
})
