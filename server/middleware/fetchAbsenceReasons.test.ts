import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonService from '../services/prisonService'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import WhereaboutsApiClient from '../data/whereaboutsApiClient'
import fetchAbsenceReasons from './fetchAbsenceReasons'
import absenceReasons from './fixtures/absence_reasons_1.json'

jest.mock('../services/prisonService')
jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/whereaboutsApiClient')

describe('fetchAbsenceReasonsList', () => {
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, whereaboutsApiClient)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Success', async () => {
    const user = {
      token: 'token',
      activeCaseLoad: { caseLoadId: 'EDI' },
    }

    const req = getMockReq({
      session: {
        user,
      },
    })
    const { res } = getMockRes({
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
    })
    const next = jest.fn()
    when(prisonService.getAbsenceReasons).mockResolvedValue(absenceReasons)
    await fetchAbsenceReasons(prisonService)(req, res, next)
    expect(res.locals.absenceReasons.paidReasons.length).toEqual(3)
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
      session: {
        data: {
          absenceReasons,
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
    when(prisonService.getAbsenceReasons).mockRejectedValue(error)
    await fetchAbsenceReasons(prisonService)(req, res, next)
    expect(next).toBeCalledWith(error)
  })
})
