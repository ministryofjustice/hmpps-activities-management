import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonService from '../services/prisonService'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import fetchActivityList from './fetchActivityList'
import atLeast from '../../jest.setup'

import activityLocations from './fixtures/activity_locations_1.json'
import activityList from './fixtures/activity_list_1.json'

jest.mock('../services/prisonService')
jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/prisonRegisterApiClient')
jest.mock('../data/whereaboutsApiClient')

describe('fetchActivityList', () => {
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const prisonRegisterApiClient = new PrisonRegisterApiClient() as jest.Mocked<PrisonRegisterApiClient>
  const whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
  const prisonService = new PrisonService(
    prisonApiClient,
    prisonerSearchApiClient,
    prisonRegisterApiClient,
    whereaboutsApiClient,
  )

  it('Success', async () => {
    const req = getMockReq({
      query: {
        prisonId: 'EDI',
        locationId: '10003',
        date: '2022-08-01',
        period: 'AM',
      },
      session: {
        data: {
          activityLocations,
        },
        user: {
          token: 'token',
        },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token' },
      },
    })
    const next = jest.fn()
    when(prisonService.searchActivities).calledWith(atLeast('10003')).mockResolvedValueOnce(activityList)

    await fetchActivityList(prisonService)(req, res, next)

    expect(res.locals.activityName).toEqual('Gym')
    expect(res.locals.activityList.length).toEqual(3)
    expect(res.locals.user).toEqual({
      token: 'token',
    })
    expect(next).toBeCalled()
  })

  it('Activity name does not match', async () => {
    const req = getMockReq({
      query: {
        prisonId: 'EDI',
        locationId: 'X',
        date: '2022-08-01',
        period: 'AM',
      },
      session: {
        data: {
          activityLocations,
        },
        user: {
          token: 'token',
        },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token' },
      },
    })
    const next = jest.fn()
    when(prisonService.searchActivities).calledWith(atLeast('X')).mockResolvedValueOnce(activityList)
    await fetchActivityList(prisonService)(req, res, next)
    expect(res.locals.activityName).toBeNull()
    expect(res.locals.user).toEqual({
      token: 'token',
    })
    expect(next).toBeCalled()
  })

  it('Prison service error', async () => {
    const req = getMockReq({
      query: {
        prisonId: 'EDI',
        locationId: '10003',
        date: '2022-08-01',
        period: 'AM',
      },
      session: {
        data: {
          activityLocations,
        },
        user: {
          token: 'token',
        },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token' },
      },
    })
    const error = new Error('Error')
    const next = jest.fn()
    when(prisonService.searchActivities).calledWith(atLeast('10003')).mockRejectedValueOnce(error)

    await fetchActivityList(prisonService)(req, res, next)

    expect(next).toBeCalledWith(error)
  })
})
