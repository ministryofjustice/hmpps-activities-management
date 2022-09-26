import UserService from './userService'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { ServiceUser } from '../@types/express'
import { HmppsAuthUser } from '../@types/hmppsAuth'

jest.mock('../data/hmppsAuthClient')

const user = {} as ServiceUser

describe('User service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let userService: UserService

  beforeEach(() => {
    hmppsAuthClient = new HmppsAuthClient() as jest.Mocked<HmppsAuthClient>
    userService = new UserService(hmppsAuthClient)
  })

  describe('getUser', () => {
    it('Retrieves and formats user name', async () => {
      hmppsAuthClient.getUser.mockResolvedValue({ name: 'john smith' } as HmppsAuthUser)

      const result = await userService.getUser(user)

      expect(result.displayName).toEqual('John Smith')
    })
    it('Propagates error', async () => {
      hmppsAuthClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(user)).rejects.toEqual(new Error('some error'))
    })
  })
})
