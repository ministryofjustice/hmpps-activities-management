import { when } from 'jest-when'
import PrisonService from '../../../../services/prisonService'
import IncentiveLevelPayMappingUtil from './incentiveLevelPayMappingUtil'
import { ServiceUser } from '../../../../@types/express'
import atLeast from '../../../../../jest.setup'
import { IepLevel } from '../../../../@types/incentivesApi/types'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create an activity - Helper', () => {
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
    }

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

      const result = await helper.getPayGroupedByIncentiveLevel(activity, user)
      expect(result).toEqual([
        {
          incentiveLevel: 'Basic',
          pays: [
            {
              incentiveLevel: 'Basic',
              id: 3,
              prisonPayBand: {
                alias: 'Medium',
                description: 'Pay band 2 (Lowest)',
                displaySequence: 2,
                id: 2,
                nomisPayBand: 2,
                prisonCode: 'MDI',
              },
              rate: 200,
            },
          ],
        },
        {
          incentiveLevel: 'Standard',
          pays: [
            {
              incentiveLevel: 'Standard',
              id: 1,
              prisonPayBand: {
                alias: 'Medium',
                description: 'Pay band 2 (Lowest)',
                displaySequence: 2,
                id: 2,
                nomisPayBand: 2,
                prisonCode: 'MDI',
              },
              rate: 200,
            },
            {
              incentiveLevel: 'Standard',
              id: 2,
              prisonPayBand: {
                alias: 'Low',
                description: 'Pay band 2 (Lowest)',
                displaySequence: 1,
                id: 1,
                nomisPayBand: 2,
                prisonCode: 'MDI',
              },
              rate: 100,
            },
          ],
        },
        {
          incentiveLevel: 'Enhanced',
          pays: [
            {
              incentiveLevel: 'Enhanced',
              id: 4,
              prisonPayBand: {
                alias: 'Medium',
                description: 'Pay band 2 (Lowest)',
                displaySequence: 4,
                id: 4,
                nomisPayBand: 4,
                prisonCode: 'MDI',
              },
              rate: 300,
            },
          ],
        },
      ])
    })
  })
})
