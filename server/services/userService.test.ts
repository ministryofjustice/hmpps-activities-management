import { when } from 'jest-when'
import UserService from './userService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { ServiceUser } from '../@types/express'
import { UserDetails } from '../@types/manageUsersApiImport/types'

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

  beforeEach(() => {
    manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
    prisonRegisterApiClient = new PrisonRegisterApiClient() as jest.Mocked<PrisonRegisterApiClient>
    activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
    userService = new UserService(manageUsersApiClient, prisonRegisterApiClient, activitiesApiClient)

    when(manageUsersApiClient.getUser).mockResolvedValue({ name: 'john smith', activeCaseLoadId: 'MDI' } as UserDetails)
    when(prisonRegisterApiClient.getPrisonInformation).mockResolvedValue({ prisonName: 'HMP Moorland' } as Prison)
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
})
