import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import ActivitiesApiClient from '../data/activitiesApiClient'
import ActivitiesService from '../services/activitiesService'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import fetchActivityList from './fetchActivityListAm'
import atLeast from '../../jest.setup'

import activityLocations from './fixtures/activity_locations_am_1.json'
import activityScheduleAllocations from './fixtures/activity_schedule_allocation_1.json'

jest.mock('../services/activitiesService')
jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

describe('fetchActivityList', () => {
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

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
    when(activitiesService.getActivitySchedules)
      .calledWith(atLeast('27219'))
      .mockResolvedValueOnce(activityScheduleAllocations)

    await fetchActivityList(activitiesService)(req, res, next)

    expect(res.locals.activityName).toEqual('Cardio')
    expect(res.locals.activityScheduleAllocations.length).toEqual(1)
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
    when(activitiesService.getActivitySchedules)
      .calledWith(atLeast('X'))
      .mockResolvedValueOnce(activityScheduleAllocations)
    await fetchActivityList(activitiesService)(req, res, next)
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
    when(activitiesService.getActivitySchedules).calledWith(atLeast('10003')).mockRejectedValueOnce(error)

    await fetchActivityList(activitiesService)(req, res, next)

    expect(next).toBeCalledWith(error)
  })
})
