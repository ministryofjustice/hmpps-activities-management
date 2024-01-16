import { when } from 'jest-when'
import UserService from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import { HmppsAuthUser } from '../@types/hmppsAuth'
import { CaseLoad, PrisonApiUserDetail } from '../@types/prisonApiImport/types'
import ActivitiesApiClient from '../data/activitiesApiClient'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/prisonApiClient')
jest.mock('../data/activitiesApiClient')
jest.mock('jwt-decode', () => ({
  jwtDecode: () => ({
    authorities: ['ROLE_ACTIVITY_HUB'],
  }),
}))

const user = { authSource: 'nomis' } as ServiceUser

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let activitiesApiClient: jest.Mocked<ActivitiesApiClient>
  let userService: UserService

  beforeEach(() => {
    hmppsAuthClient = new HmppsAuthClient() as jest.Mocked<HmppsAuthClient>
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
    userService = new UserService(hmppsAuthClient, prisonApiClient, activitiesApiClient)

    when(hmppsAuthClient.getUser).mockResolvedValue({ name: 'john smith' } as HmppsAuthUser)
    when(prisonApiClient.getUser).mockResolvedValue({ staffId: 1000 } as PrisonApiUserDetail)
    when(prisonApiClient.getUserCaseLoads).mockResolvedValue([
      { caseLoadId: 'MDI', currentlyActive: true },
      { caseLoadId: 'LEI', currentlyActive: false },
    ] as CaseLoad[])
    when(activitiesApiClient.getPrisonRolloutPlan).mockResolvedValue({
      prisonCode: 'MDI',
      activitiesRolledOut: true,
      appointmentsRolledOut: true,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUser', () => {
    it('Retrieves user information', async () => {
      const result = await userService.getUser(user)

      expect(hmppsAuthClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUserCaseLoads).toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
      expect(result.roles).toEqual(['ROLE_ACTIVITY_HUB'])
      expect(result.staffId).toEqual(1000)
      expect(result.allCaseLoads).toEqual([
        { caseLoadId: 'MDI', currentlyActive: true },
        { caseLoadId: 'LEI', currentlyActive: false },
      ])
      expect(result.activeCaseLoad).toEqual({ caseLoadId: 'MDI', currentlyActive: true })
    })
  })
})
