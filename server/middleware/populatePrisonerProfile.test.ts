import { NextFunction, Request, Response } from 'express'
import { when } from 'jest-when'
import populatePrisonerProfile from './populatePrisonerProfile'
import PrisonService from '../services/prisonService'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import atLeast from '../../jest.setup'

jest.mock('../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const mockPrisoner: Prisoner = {
  prisonerNumber: 'ABC123',
  firstName: 'Joe',
  lastName: 'Bloggs',
  cellLocation: '1-2-001',
  prisonId: 'LEI',
  status: 'ACTIVE IN',
  lastMovementTypeCode: 'CRT',
  releaseDate: '2019-11-30',
  alerts: [{ alertType: 'R', alertCode: 'RLO', active: true, expired: false }],
} as Prisoner

describe('populatePrisonerProfile', () => {
  let req: Request
  let res: Response
  let next: NextFunction
  const middleware = populatePrisonerProfile(prisonService)

  beforeEach(() => {
    res = {
      redirect: jest.fn(),
      locals: {},
    } as unknown as Response

    req = {
      params: {
        prisonerNumber: 'ABC123',
      },
    } as unknown as Request

    next = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should populate res.locals with the prisoner profile cell location', async () => {
    const mockPrisonerWithCell = {
      ...mockPrisoner,
      lastMovementTypeCode: 'ADM',
    }

    when(prisonService.getInmateByPrisonerNumber)
      .calledWith(atLeast('ABC123'))
      .mockResolvedValueOnce(mockPrisonerWithCell)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.locals.prisonerProfile).toEqual({
      ...mockPrisonerWithCell,
      earliestReleaseDate: '2019-11-30',
      workplaceRiskAssessment: 'LOW',
      location: '1-2-001',
    })
  })

  it('should populate res.locals with the prisoner profile in court', async () => {
    when(prisonService.getInmateByPrisonerNumber).calledWith(atLeast('ABC123')).mockResolvedValueOnce(mockPrisoner)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.locals.prisonerProfile).toEqual({
      ...mockPrisoner,
      earliestReleaseDate: '2019-11-30',
      workplaceRiskAssessment: 'LOW',
      location: 'Court',
    })
  })

  it('should populate res.locals with the prisoner profile released', async () => {
    const mockPrisonerReleased = { ...mockPrisoner }
    mockPrisonerReleased.lastMovementTypeCode = 'REL'

    when(prisonService.getInmateByPrisonerNumber)
      .calledWith(atLeast('ABC123'))
      .mockResolvedValueOnce(mockPrisonerReleased)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.locals.prisonerProfile).toEqual({
      ...mockPrisonerReleased,
      earliestReleaseDate: '2019-11-30',
      workplaceRiskAssessment: 'LOW',
      location: 'Released',
    })
  })
})
