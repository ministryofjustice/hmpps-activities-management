import { when } from 'jest-when'
import createHttpError from 'http-errors'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import UserService from './userService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { ServiceUser } from '../@types/express'
import { UserDetails } from '../@types/manageUsersApiImport/types'
import atLeast from '../../jest.setup'

jest.mock('../data/manageUsersApiClient')
jest.mock('../data/prisonRegisterApiClient')
jest.mock('../data/activitiesApiClient')
jest.mock('jwt-decode', () => ({
  jwtDecode: () => ({
    authorities: ['ROLE_ACTIVITY_HUB'],
  }),
}))

const user = { authSource: 'nomis' } as Express.User

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let prisonRegisterApiClient: jest.Mocked<PrisonRegisterApiClient>
  let activitiesApiClient: jest.Mocked<ActivitiesApiClient>
  let userService: UserService
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
    prisonRegisterApiClient = new PrisonRegisterApiClient(
      mockAuthenticationClient,
    ) as jest.Mocked<PrisonRegisterApiClient>
    activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
    userService = new UserService(manageUsersApiClient, prisonRegisterApiClient, activitiesApiClient)

    when(manageUsersApiClient.getUser).mockResolvedValue({ name: 'john smith', activeCaseLoadId: 'MDI' } as UserDetails)
    when(prisonRegisterApiClient.getPrisonInformation).mockResolvedValue({ prisonName: 'HMP Moorland' } as Prison)
    when(activitiesApiClient.getPrisonRolloutPlan).mockResolvedValue({
      prisonCode: 'MDI',
      activitiesRolledOut: true,
      appointmentsRolledOut: true,
      maxDaysToExpiry: 21,
      prisonLive: true,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUser', () => {
    it('Retrieves user information', async () => {
      const result = await userService.getUser(user, undefined)

      expect(activitiesApiClient.getPrisonRolloutPlan).toHaveBeenCalled()
      expect(prisonRegisterApiClient.getPrisonInformation).toHaveBeenCalled()

      expect(manageUsersApiClient.getUser).toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
      expect(result.roles).toEqual(['ROLE_ACTIVITY_HUB'])
      expect(result.activeCaseLoadId).toEqual('MDI')
      expect(result.activeCaseLoadDescription).toEqual('HMP Moorland')
      expect(result.isActivitiesRolledOut).toEqual(true)
      expect(result.isAppointmentsRolledOut).toEqual(true)
    })

    it('Retrieves user information - does not request prison information if already in session', async () => {
      const userInSession = {
        activeCaseLoadId: 'MDI',
        activeCaseLoadDescription: 'HMP Moorland',
        isActivitiesRolledOut: true,
        isAppointmentsRolledOut: true,
      } as ServiceUser

      const result = await userService.getUser(user, userInSession)

      expect(activitiesApiClient.getPrisonRolloutPlan).not.toHaveBeenCalled()
      expect(prisonRegisterApiClient.getPrisonInformation).not.toHaveBeenCalled()

      expect(manageUsersApiClient.getUser).toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
      expect(result.roles).toEqual(['ROLE_ACTIVITY_HUB'])
      expect(result.activeCaseLoadId).toEqual('MDI')
      expect(result.activeCaseLoadDescription).toEqual('HMP Moorland')
      expect(result.isActivitiesRolledOut).toEqual(true)
      expect(result.isAppointmentsRolledOut).toEqual(true)
    })

    it('Retrieves user information - when caseload in session is now different', async () => {
      const userInSession = {
        activeCaseLoadId: 'PVI',
        activeCaseLoadDescription: 'HMP Pentonville',
        isActivitiesRolledOut: true,
        isAppointmentsRolledOut: true,
      } as ServiceUser

      const result = await userService.getUser(user, userInSession)

      expect(activitiesApiClient.getPrisonRolloutPlan).toHaveBeenCalled()
      expect(prisonRegisterApiClient.getPrisonInformation).toHaveBeenCalled()

      expect(manageUsersApiClient.getUser).toHaveBeenCalled()
      expect(result.displayName).toEqual('John Smith')
      expect(result.roles).toEqual(['ROLE_ACTIVITY_HUB'])
      expect(result.activeCaseLoadId).toEqual('MDI')
      expect(result.activeCaseLoadDescription).toEqual('HMP Moorland')
      expect(result.isActivitiesRolledOut).toEqual(true)
      expect(result.isAppointmentsRolledOut).toEqual(true)
    })
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
