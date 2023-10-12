import { Request } from 'express'

import { when } from 'jest-when'
import IncentiveLevelPayMappingUtil from './incentiveLevelPayMappingUtil'
import PrisonService from '../../services/prisonService'
import { ServiceUser } from '../../@types/express'
import atLeast from '../../../jest.setup'
import { IncentiveLevel } from '../../@types/incentivesApi/types'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Helper', () => {
  const helper = new IncentiveLevelPayMappingUtil(prisonService)
  let req: Request
  let user: ServiceUser

  beforeEach(() => {
    req = {
      session: {
        createJourney: {
          pay: [
            { incentiveLevel: 'Standard', prisonPayBand: { id: 2, displaySequence: 2 }, rate: 200 },
            { incentiveLevel: 'Standard', prisonPayBand: { id: 1, displaySequence: 1 }, rate: 100 },
            { incentiveLevel: 'Basic', prisonPayBand: { id: 3, displaySequence: 3 }, rate: 300 },
            { incentiveLevel: 'Enhanced', prisonPayBand: { id: 4, displaySequence: 4 }, rate: 400 },
          ],
          allocations: [{ prisonerNumber: 'ABC123', prisonPayBand: { id: 1 } }],
        },
      },
    } as Request

    user = {
      username: 'joebloggs',
      activeCaseLoadId: 'MDI',
    } as ServiceUser
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getPayGroupedByIncentiveLevel', () => {
    it('should group pay by incentive level', async () => {
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([
          { levelName: 'Basic' },
          { levelName: 'Standard' },
          { levelName: 'Enhanced' },
        ] as IncentiveLevel[])
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue([
          { prisonerNumber: 'ABC123', currentIncentive: { level: { description: 'Standard' } } },
        ] as Prisoner[])

      const result = await helper.getPayGroupedByIncentiveLevel(
        req.session.createJourney.pay,
        req.session.createJourney.allocations,
        user,
      )
      expect(result).toEqual([
        {
          incentiveLevel: 'Basic',
          pays: [
            { allocationCount: 0, incentiveLevel: 'Basic', prisonPayBand: { id: 3, displaySequence: 3 }, rate: 300 },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            { allocationCount: 1, incentiveLevel: 'Standard', prisonPayBand: { id: 1, displaySequence: 1 }, rate: 100 },
            { allocationCount: 0, incentiveLevel: 'Standard', prisonPayBand: { id: 2, displaySequence: 2 }, rate: 200 },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            { allocationCount: 0, incentiveLevel: 'Enhanced', prisonPayBand: { id: 4, displaySequence: 4 }, rate: 400 },
          ],
        },
      ])
    })
  })
})
