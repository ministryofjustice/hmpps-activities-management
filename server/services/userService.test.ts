import UserService from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import PrisonApiClient from '../data/prisonApiClient'
import NomisUserApiClient from '../data/nomisUserApiClient'
import { HmppsAuthUser } from '../@types/hmppsAuth'
import { CaseLoad, PrisonApiUserDetail } from '../@types/prisonApiImport/types'
import { UserRoleDetail } from '../@types/nomisUserApiImport/types'
import ActivitiesApiClient from '../data/activitiesApiClient'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/nomisUserApiClient')
jest.mock('../data/prisonApiClient')
jest.mock('../data/activitiesApiClient')

let user = {} as ServiceUser

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let nomisUserApiClient: jest.Mocked<NomisUserApiClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let activitiesApiClient: jest.Mocked<ActivitiesApiClient>
  let userService: UserService

  beforeEach(() => {
    hmppsAuthClient = new HmppsAuthClient() as jest.Mocked<HmppsAuthClient>
    nomisUserApiClient = new NomisUserApiClient() as jest.Mocked<NomisUserApiClient>
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
    userService = new UserService(hmppsAuthClient, nomisUserApiClient, prisonApiClient, activitiesApiClient)

    hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as HmppsAuthUser)
    nomisUserApiClient.getUserRoles.mockResolvedValue({
      dpsRoles: [],
      nomisRoles: [{ caseload: { id: 'MDI' }, roles: [] }],
    } as UserRoleDetail)
    prisonApiClient.getUser.mockResolvedValue({ staffId: 1000 } as PrisonApiUserDetail)
    prisonApiClient.getUserCaseLoads.mockResolvedValue([
      { caseLoadId: 'MDI', currentlyActive: true },
      { caseLoadId: 'LEI', currentlyActive: false },
    ] as CaseLoad[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUser', () => {
    it('Retrieves user information from auth', async () => {
      const result = await userService.getUser(user)

      expect(hmppsAuthClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUser).not.toHaveBeenCalled()
      expect(prisonApiClient.getUserCaseLoads).not.toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
    })

    it('Retrieves user information from nomis user api', async () => {
      user = { ...user, authSource: 'nomis' }

      const result = await userService.getUser(user)

      expect(hmppsAuthClient.getUser).toHaveBeenCalled()
      expect(nomisUserApiClient.getUserRoles).toHaveBeenCalled()
      expect(prisonApiClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUserCaseLoads).toHaveBeenCalled()
      expect(result.roles).toEqual([])
    })

    it('Retrieves user information from prison api', async () => {
      user = { ...user, authSource: 'nomis' }

      const result = await userService.getUser(user)

      expect(hmppsAuthClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUserCaseLoads).toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
      expect(result.staffId).toEqual(1000)
      expect(result.allCaseLoads).toEqual([
        { caseLoadId: 'MDI', currentlyActive: true },
        { caseLoadId: 'LEI', currentlyActive: false },
      ])
      expect(result.activeCaseLoad).toEqual({ caseLoadId: 'MDI', currentlyActive: true })
    })
  })
})
