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

      fakePrisonApi.get('/api/offenders/ABC123').matchHeader('authorization', `Bearer accessToken`).reply(200, response)

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

  describe('getUserCaseLoads', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi.get('/api/users/me/caseLoads').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await prisonApiClient.getUserCaseLoads(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('setActiveCaseLoad', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .put('/api/users/me/activeCaseLoad', { caseLoadId: 'MDI' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.setActiveCaseLoad('MDI', user)

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

  describe('getActivitiesAtLocation', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .get('/api/schedules/locations/MDI/activities')
        .query({ date: '2022-08-01', timeSlot: 'AM', includeSuspended: 'true' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getActivitiesAtLocation('MDI', '2022-08-01', 'AM', true, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivityList', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .get('/api/schedules/MDI/locations/10001/usage/VISIT')
        .query({ date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getActivityList('MDI', '10001', '2022-08-01', 'AM', 'VISIT', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getVisits', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/schedules/MDI/visits', ['G10001', 'G10002'])
        .query({ date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getVisits('MDI', '2022-08-01', 'AM', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointments', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/schedules/MDI/appointments', ['G10001', 'G10002'])
        .query({ date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getAppointments('MDI', '2022-08-01', 'AM', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivities', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/schedules/MDI/activities', ['G10001', 'G10002'])
        .query({ date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getActivities('MDI', '2022-08-01', 'AM', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getSentenceData', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/offender-sentences', ['G10001', 'G10002'])
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getSentenceData(['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getCourtEvents', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/schedules/MDI/courtEvents', ['G10001', 'G10002'])
        .query({ date: '2022-08-01' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getCourtEvents('MDI', '2022-08-01', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getExternalTransfers', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/schedules/MDI/externalTransfers', ['G10001', 'G10002'])
        .query({ date: '2022-08-01' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getExternalTransfers('MDI', '2022-08-01', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAlerts', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/bookings/offenderNo/MDI/alerts', ['G10001', 'G10002'])
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getAlerts('MDI', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAssessments', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApi
        .post('/api/offender-assessments/CATEGORY', ['G10001', 'G10002'])
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await prisonApiClient.getAssessments('CATEGORY', ['G10001', 'G10002'], user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})
