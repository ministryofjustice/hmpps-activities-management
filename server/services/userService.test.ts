import UserService from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import { HmppsAuthUser } from '../@types/hmppsAuth'
import PrisonApiClient from '../data/prisonApiClient'
import { PrisonApiUserDetail } from '../@types/prisonApiImport/types'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/prisonApiClient')

let user = {} as ServiceUser

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let userService: UserService

  beforeEach(() => {
    hmppsAuthClient = new HmppsAuthClient() as jest.Mocked<HmppsAuthClient>
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    userService = new UserService(hmppsAuthClient, prisonApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUser', () => {
    it('Retrieves user information from auth', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as HmppsAuthUser)

      const result = await userService.getUser(user)

      expect(hmppsAuthClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUser).not.toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
    })

    it('Retrieves user information from nomis', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as HmppsAuthUser)
      prisonApiClient.getUser.mockResolvedValue({ staffId: 1000 } as PrisonApiUserDetail)

      user = { ...user, authSource: 'nomis' }

      const result = await userService.getUser(user)

      expect(hmppsAuthClient.getUser).toHaveBeenCalled()
      expect(prisonApiClient.getUser).toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
      expect(result.staffId).toEqual(1000)
    })
  })
})
