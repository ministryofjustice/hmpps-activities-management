import nock from 'nock'
import { when } from 'jest-when'
import { Request, Response } from 'express'
import { serviceCheckFactory } from './healthCheck'
import { AgentConfig } from '../config'
import activeRolledPrisons from '../services/rolledOutPrision'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'
import ActivitiesService from '../services/activitiesService'

jest.mock('../services/activitiesService')
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Service healthcheck', () => {
  const healthcheck = serviceCheckFactory('externalService', 'http://test-service.com/ping', new AgentConfig(), {
    response: 100,
    deadline: 150,
  })

  let fakeServiceApi: nock.Scope

  beforeEach(() => {
    fakeServiceApi = nock('http://test-service.com')
  })

  afterEach(() => {
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('Check healthy', () => {
    it('Should return data from api', async () => {
      fakeServiceApi.get('/ping').reply(200, 'pong')

      const output = await healthcheck()
      expect(output).toEqual('OK')
    })
  })

  describe('Check unhealthy', () => {
    it('Should throw error from api', async () => {
      fakeServiceApi.get('/ping').thrice().reply(500)

      await expect(healthcheck()).rejects.toThrow('Internal Server Error')
    })
  })

  describe('Check unhealthy', () => {
    it('Should throw error from api', async () => {
      fakeServiceApi.get('/ping').thrice().reply(500)

      await expect(healthcheck()).rejects.toThrow('Internal Server Error')
    })
  })

  describe('Check rolled out Prisons', () => {
    let req: Request
    const res: Response = {
      json: jest.fn(),
    } as unknown as Response

    it('should return agencies with both activities and appointments rolled out', async () => {
      when(activitiesService.getRolledOutPrisons).mockResolvedValue([
        { prisonCode: 'MDI', activitiesRolledOut: true, appointmentsRolledOut: true },
        { prisonCode: 'LEI', activitiesRolledOut: false, appointmentsRolledOut: true },
      ] as RolloutPrisonPlan[])

      const handler = activeRolledPrisons(activitiesService)

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith({ activeAgencies: ['MDI'] })
    })

    it('should return an empty array when no agencies have both activities and appointments rolled out', async () => {
      when(activitiesService.getRolledOutPrisons).mockResolvedValue([
        { prisonCode: 'MDI', activitiesRolledOut: false, appointmentsRolledOut: true },
        { prisonCode: 'LEI', activitiesRolledOut: false, appointmentsRolledOut: true },
      ] as RolloutPrisonPlan[])

      const handler = activeRolledPrisons(activitiesService)

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith({ activeAgencies: [] })
    })

    it('should return all agencies when all have both activities and appointments rolled out', async () => {
      when(activitiesService.getRolledOutPrisons).mockResolvedValue([
        { prisonCode: 'MDI', activitiesRolledOut: true, appointmentsRolledOut: true },
        { prisonCode: 'LPI', activitiesRolledOut: true, appointmentsRolledOut: true },
      ] as RolloutPrisonPlan[])

      const handler = activeRolledPrisons(activitiesService)

      await handler(req, res)

      expect(res.json).toHaveBeenCalledWith({ activeAgencies: ['MDI', 'LPI'] })
    })
  })

  describe('Check healthy retry test', () => {
    it('Should retry twice if request fails', async () => {
      fakeServiceApi
        .get('/ping')
        .reply(500, { failure: 'one' })
        .get('/ping')
        .reply(500, { failure: 'two' })
        .get('/ping')
        .reply(200, 'pong')

      const response = await healthcheck()
      expect(response).toEqual('OK')
    })

    it('Should retry twice if request times out', async () => {
      fakeServiceApi
        .get('/ping')
        .delay(10000) // delay set to 10s, timeout to 900/3=300ms
        .reply(200, { failure: 'one' })
        .get('/ping')
        .delay(10000)
        .reply(200, { failure: 'two' })
        .get('/ping')
        .reply(200, 'pong')

      const response = await healthcheck()
      expect(response).toEqual('OK')
    })

    it('Should fail if request times out three times', async () => {
      fakeServiceApi
        .get('/ping')
        .delay(10000) // delay set to 10s, timeout to 900/3=300ms
        .reply(200, { failure: 'one' })
        .get('/ping')
        .delay(10000)
        .reply(200, { failure: 'two' })
        .get('/ping')
        .delay(10000)
        .reply(200, { failure: 'three' })

      await expect(healthcheck()).rejects.toThrow('Response timeout of 100ms exceeded')
    })
  })
})
