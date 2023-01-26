import { Request } from 'express'

import { when } from 'jest-when'
import PrisonService from '../../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './incentiveLevelPayMappingUtil'
import { ServiceUser } from '../../../../@types/express'
import atLeast from '../../../../../jest.setup'
import { IepLevel } from '../../../../@types/incentivesApi/types'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Helper', () => {
  const helper = new IncentiveLevelPayMappingUtil(prisonService)
  let req: Request
  let user: ServiceUser

  beforeEach(() => {
    req = {
      session: {
        createJourney: {
          pay: [
            { incentiveLevel: 'Standard', bandId: 2, rate: 200, displaySequence: 2 },
            { incentiveLevel: 'Standard', bandId: 1, rate: 100, displaySequence: 1 },
            { incentiveLevel: 'Basic', bandId: 3, rate: 300, displaySequence: 3 },
            { incentiveLevel: 'Enhanced', bandId: 4, rate: 400, displaySequence: 4 },
          ],
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
          { iepDescription: 'Standard', sequence: 2 },
          { iepDescription: 'Basic', sequence: 1 },
          { iepDescription: 'Enhanced', sequence: 3 },
        ] as IepLevel[])

      const result = await helper.getPayGroupedByIncentiveLevel(req, user)
      expect(result).toEqual([
        { incentiveLevel: 'Basic', pays: [{ incentiveLevel: 'Basic', bandId: 3, rate: 300, displaySequence: 3 }] },
        {
          incentiveLevel: 'Standard',
          pays: [
            { incentiveLevel: 'Standard', bandId: 1, rate: 100, displaySequence: 1 },
            { incentiveLevel: 'Standard', bandId: 2, rate: 200, displaySequence: 2 },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [{ incentiveLevel: 'Enhanced', bandId: 4, rate: 400, displaySequence: 4 }],
        },
      ])
    })
  })
})
