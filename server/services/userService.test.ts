import { when } from 'jest-when'
import createHttpError from 'http-errors'
import UserService from './userService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { ServiceUser } from '../@types/express'
import { UserDetails } from '../@types/manageUsersApiImport/types'
import atLeast from '../../jest.setup'

jest.mock('../data/manageUsersApiClient')

const user = { authSource: 'nomis' } as Express.User

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let userService: UserService

  beforeEach(() => {
    manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
    userService = new UserService(manageUsersApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUserMap', () => {
    it('Retrieves user information for a list of usernames', async () => {
      const usernames = ['jbloggs', null, undefined, 'jbloggs', 'jsmith']

      when(manageUsersApiClient.getUserByUsername)
        .calledWith(atLeast('jbloggs'))
        .mockResolvedValue({ name: 'Joe Bloggs', username: 'jbloggs', authSource: 'nomis' } as UserDetails)

      when(manageUsersApiClient.getUserByUsername)
        .calledWith(atLeast('jsmith'))
        .mockResolvedValue({ name: 'John Smith', username: 'jsmith', authSource: 'nomis' } as UserDetails)

      const result = await userService.getUserMap(usernames, user as ServiceUser)

      expect(result).toEqual(
        new Map([
          ['jbloggs', { name: 'Joe Bloggs', username: 'jbloggs', authSource: 'nomis' }],
          ['jsmith', { name: 'John Smith', username: 'jsmith', authSource: 'nomis' }],
        ]),
      )

      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledTimes(2)
      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledWith('jsmith', { authSource: 'nomis' })
      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledWith('jbloggs', { authSource: 'nomis' })
    })

    it('Returns service name as a User object if service name is provided as a username', async () => {
      const usernames = ['Activities Management Service']

      const result = await userService.getUserMap(usernames, user as ServiceUser)

      expect(result).toEqual(
        new Map([
          [
            'Activities Management Service',
            { name: 'Activities Management Service', username: 'Activities Management Service' },
          ],
        ]),
      )

      expect(manageUsersApiClient.getUserByUsername).not.toHaveBeenCalled()
    })

    it('Returns External user as a User object if the user name is not found', async () => {
      const usernames = ['hmpps-book-a-video-link-client']

      when(manageUsersApiClient.getUserByUsername)
        .calledWith(atLeast('hmpps-book-a-video-link-client'))
        .mockRejectedValue(createHttpError.NotFound())

      const result = await userService.getUserMap(usernames, user as ServiceUser)

      expect(result).toEqual(
        new Map([
          ['hmpps-book-a-video-link-client', { name: 'External user', username: 'hmpps-book-a-video-link-client' }],
        ]),
      )

      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledWith('hmpps-book-a-video-link-client', {
        authSource: 'nomis',
      })
    })

    it('Returns External user as a User object if the user is not a prison user', async () => {
      const usernames = ['external-user']

      when(manageUsersApiClient.getUserByUsername)
        .calledWith(atLeast('external-user'))
        .mockResolvedValue({ name: 'John Smith', username: 'jsmith', authSource: 'auth' } as UserDetails)

      const result = await userService.getUserMap(usernames, user as ServiceUser)

      expect(result).toEqual(new Map([['external-user', { name: 'External user', username: 'external-user' }]]))

      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledWith('external-user', {
        authSource: 'nomis',
      })
    })

    it('Propagates non 404 error from Manage Users API client', async () => {
      const usernames = ['jbloggs']

      when(manageUsersApiClient.getUserByUsername)
        .calledWith(atLeast('jbloggs'))
        .mockRejectedValue(createHttpError.InternalServerError())

      await expect(userService.getUserMap(usernames, user as ServiceUser)).rejects.toThrow()
    })
  })
})
