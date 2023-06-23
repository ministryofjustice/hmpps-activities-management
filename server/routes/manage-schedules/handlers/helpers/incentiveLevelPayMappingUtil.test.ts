import { when } from 'jest-when'
import { Request } from 'express'
import PrisonService from '../../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './incentiveLevelPayMappingUtil'
import { ServiceUser } from '../../../../@types/express'
import atLeast from '../../../../../jest.setup'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Edit an activity - Helper', () => {
  const helper = new IncentiveLevelPayMappingUtil(prisonService)
  let user: ServiceUser
  let activity: Activity

  beforeEach(() => {
    activity = {
      attendanceRequired: false,
      category: { code: '', id: 0, name: '' },
      createdBy: '',
      createdTime: '',
      eligibilityRules: [],
      id: 0,
      inCell: false,
      minimumIncentiveNomisCode: 'BAS',
      minimumIncentiveLevel: 'Basic',
      outsideWork: false,
      payPerSession: '',
      pieceWork: false,
      prisonCode: '',
      schedules: [],
      startDate: '',
      summary: '',
      waitingList: [],
      pay: [
        {
          id: 1,
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: {
            id: 2,
            displaySequence: 2,
            alias: 'Medium',
            description: 'Pay band 2 (Lowest)',
            nomisPayBand: 2,
            prisonCode: 'MDI',
          },
          rate: 200,
        },
        {
          id: 2,
          incentiveNomisCode: 'STD',
          incentiveLevel: 'Standard',
          prisonPayBand: {
            id: 1,
            displaySequence: 1,
            alias: 'Low',
            description: 'Pay band 2 (Lowest)',
            nomisPayBand: 2,
            prisonCode: 'MDI',
          },
          rate: 100,
        },
        {
          id: 3,
          incentiveNomisCode: 'BAS',
          incentiveLevel: 'Basic',
          prisonPayBand: {
            id: 2,
            displaySequence: 2,
            alias: 'Medium',
            description: 'Pay band 2 (Lowest)',
            nomisPayBand: 2,
            prisonCode: 'MDI',
          },
          rate: 200,
        },
        {
          id: 4,
          incentiveNomisCode: 'ENH',
          incentiveLevel: 'Enhanced',
          prisonPayBand: {
            id: 4,
            displaySequence: 4,
            alias: 'Medium',
            description: 'Pay band 2 (Lowest)',
            nomisPayBand: 4,
            prisonCode: 'MDI',
          },
          rate: 300,
        },
      ],
      minimumEducationLevel: [],
    } as unknown as Activity

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

      const req = {
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

      const result = await helper.getPayGroupedByIncentiveLevel(req.session.createJourney.pay, user, activity)
      expect(result).toEqual([
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              incentiveLevel: 'Basic',
              bandId: 3,
              displaySequence: 3,
              rate: 300,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              incentiveLevel: 'Standard',
              bandId: 1,
              displaySequence: 1,
              rate: 100,
            },
            {
              incentiveLevel: 'Standard',
              bandId: 2,
              displaySequence: 2,
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            {
              incentiveLevel: 'Enhanced',
              bandId: 4,
              displaySequence: 4,
              rate: 400,
            },
          ],
        },
      ])
    })
  })
})
