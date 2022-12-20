import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonService from '../services/prisonService'
import fetchActivityList from './fetchActivityList'
import atLeast from '../../jest.setup'

import activityLocations from './fixtures/activity_locations_1.json'
import activityList from './fixtures/activity_list_1.json'

jest.mock('../services/prisonService')

describe('fetchActivityList', () => {
  const prisonService = new PrisonService(null, null, null, null)

  it('Success', async () => {
    const req = getMockReq({
      query: {
        prisonId: 'EDI',
        locationId: '27219',
        date: '2022-10-05',
        period: 'PM',
      },
      session: {
        data: {
          activityLocations,
        },
        user: {
          token: 'token',
          activeCaseLoad: { caseLoadId: 'EDI' },
        },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
    })
    const next = jest.fn()
    when(prisonService.searchActivities).calledWith(atLeast('27219')).mockResolvedValueOnce(activityList)

    await fetchActivityList(prisonService)(req, res, next)

    expect(res.locals.activityName).toEqual('Cardio')
    expect(res.locals.activityList.length).toEqual(3)
    expect(res.locals.user).toEqual({
      token: 'token',
      activeCaseLoad: { caseLoadId: 'EDI' },
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
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
    })
    const next = jest.fn()
    when(prisonService.searchActivities).calledWith(atLeast('X')).mockResolvedValueOnce(activityList)
    await fetchActivityList(prisonService)(req, res, next)
    expect(res.locals.activityName).toBeNull()
    expect(res.locals.user).toEqual({ token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } })
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
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
    })
    const error = new Error('Error')
    const next = jest.fn()
    when(prisonService.searchActivities).calledWith(atLeast('10003')).mockRejectedValueOnce(error)

    await fetchActivityList(prisonService)(req, res, next)

    expect(next).toBeCalledWith(error)
  })
})
