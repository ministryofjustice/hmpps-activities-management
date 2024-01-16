import nock from 'nock'

import config from '../config'
import PrisonApiClient from './prisonApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'

const user = { token: 'token' } as ServiceUser

jest.mock('./tokenStore')

describe('prisonApiClient', () => {
  let fakePrisonApi: nock.Scope
  let prisonApiClient: PrisonApiClient

  beforeEach(() => {
    fakePrisonApi = nock(config.apis.prisonApi.url)
    prisonApiClient = new PrisonApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getInmateDetail', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/offenders/ABC123').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await prisonApiClient.getInmateDetail('ABC123', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/users/me').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await prisonApiClient.getUser(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getUserByUsername', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/users/USERNAME').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await prisonApiClient.getUserByUsername('USERNAME', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getUserCaseLoads', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/users/me/caseLoads').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await prisonApiClient.getUserCaseLoads(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchActivityLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .get('/api/agencies/MDI/eventLocationsBooked')
        .query({ bookedOnDay: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.searchActivityLocations('MDI', '2022-08-01', 'AM', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getInmateDetails', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/bookings/offenders', ['G10001', 'G10002'])
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getInmateDetails(['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getEventLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .get('/api/agencies/MDI/eventLocations')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getEventLocations('MDI', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getLocationsForEventType', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .get('/api/agencies/MDI/locations?eventType=APP')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getLocationsForEventType('MDI', 'APP', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPayProfile', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/agencies/MDI/pay-profile').reply(200, response)

      const output = await prisonApiClient.getPayProfile('MDI')
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
