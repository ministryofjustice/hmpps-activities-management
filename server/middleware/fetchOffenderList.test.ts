import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import PrisonService from '../services/prisonService'
import atLeast from '../../jest.setup'
import inmateDetails1 from './fixtures/inmate_details_1.json'
import fetchOffenderList from './fetchOffenderList'

jest.mock('../services/prisonService')
jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/prisonRegisterApiClient')
jest.mock('../data/whereaboutsApiClient')

describe('fetchOffenderList', () => {
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
        prisonId: 'MDI',
      },
      session: {
        user: {
          token: 'token',
          activeCaseLoad: { caseLoadId: 'MDI' },
        },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
      },
    })
    const next = jest.fn()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    when(prisonService.getInmates).calledWith(atLeast('MDI')).mockResolvedValueOnce(inmateDetails1)

    await fetchOffenderList(prisonService)(req, res, next)

    expect(res.locals.offenderListPage.content.length).toEqual(3)
    expect(res.locals.offenderListPage.content[0].lastName).toEqual('CHOLAK')
    expect(res.locals.user).toEqual({
      token: 'token',
      activeCaseLoad: { caseLoadId: 'MDI' },
    })
    expect(next).toBeCalled()
  })

  it('Prison service error', async () => {
    const req = getMockReq({
      query: {
        prisonId: 'MDI',
      },
      session: {
        user: {
          token: 'token',
          activeCaseLoad: { caseLoadId: 'MDI' },
        },
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
      },
    })
    const error = new Error('Error')
    const next = jest.fn()
    when(prisonService.getInmates).calledWith(atLeast('MDI')).mockRejectedValueOnce(error)

    await fetchOffenderList(prisonService)(req, res, next)

    expect(next).toBeCalledWith(error)
  })
})
