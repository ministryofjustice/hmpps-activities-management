import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import ActivitiesApiClient from '../data/activitiesApiClient'
import ActivitiesService from '../services/activitiesService'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import fetchActivity from './fetchActivity'
import atLeast from '../../jest.setup'

import activity from './fixtures/activity_1.json'
import { Activity } from '../@types/activitiesAPI/types'

jest.mock('../services/activitiesService')
jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

describe('fetchActivityList', () => {
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  it('Success', async () => {
    const req = getMockReq({
      params: {
        activityId: '1',
      },
      session: {
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
    when(activitiesService.getActivity)
      .calledWith(atLeast(1))
      .mockResolvedValueOnce(activity as Activity)

    await fetchActivity(activitiesService)(req, res, next)

    expect(res.locals.activity.summary).toEqual('Climbing')
    expect(res.locals.user).toEqual({
      token: 'token',
      activeCaseLoad: { caseLoadId: 'EDI' },
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
      params: {
        activityId: '1',
      },
      session: {
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
    when(activitiesService.getActivity).calledWith(atLeast(1)).mockRejectedValueOnce(error)

    await fetchActivity(activitiesService)(req, res, next)

    expect(next).toBeCalledWith(error)
  })
})
