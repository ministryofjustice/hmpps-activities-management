import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesService from './activitiesService'
import { ServiceUser } from '../@types/express'
import { RolloutPrison } from '../@types/activitiesAPI/types'
import activityLocations from './fixtures/activity_locations_am_1.json'
import activitySchedules from './fixtures/activity_schedules_1.json'
import prisoners from './fixtures/prisoners_1.json'
import activityScheduleAllocation from './fixtures/activity_schedule_allocation_1.json'

jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

describe('Activities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  const user = {} as ServiceUser

  describe('getPrison', () => {
    it('should get rollout prison information from activities API', async () => {
      const expectedResult = { id: 1, code: 'MDI', description: 'Moorlands', active: true } as RolloutPrison
      when(activitiesApiClient.getRolloutPrison).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)
      const actualResult = await activitiesService.getPrison('MDI', user)
      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getRolloutPrison).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('populateUserPrisonInfo', () => {
    it('should add the rpisons rollout status to the users caseload info API', async () => {
      const rolloutPrisonResult = { id: 1, code: 'MDI', description: 'Moorlands', active: true } as RolloutPrison
      when(activitiesApiClient.getRolloutPrison).calledWith(atLeast('MDI')).mockResolvedValue(rolloutPrisonResult)

      const testUser = {
        allCaseLoads: [
          {
            caseLoadId: 'MDI',
            caseloadFunction: 'ADMIN',
            currentlyActive: true,
            description: 'Moorlands',
            type: 'APP',
          },
        ],
      } as ServiceUser

      const actualResult = await activitiesService.populateUserPrisonInfo(testUser)

      const expectedResult = {
        allCaseLoads: [
          {
            caseLoadId: 'MDI',
            caseloadFunction: 'ADMIN',
            currentlyActive: true,
            description: 'Moorlands',
            type: 'APP',
            isRolledOut: true,
          },
        ],
      } as ServiceUser
      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getRolloutPrison).toHaveBeenCalledWith('MDI', testUser)
    })
  })

  describe('getScheduledPrisonLocations', () => {
    it('should fetch internal prison locations that have activities scheduled using the activities API', async () => {
      when(activitiesApiClient.getScheduledPrisonLocations)
        .calledWith(atLeast('10001'))
        .mockResolvedValue(activityLocations)
      const locations = await activitiesService.getScheduledPrisonLocations('EDI', '10001', '2022-08-01', user)
      expect(locations.length).toEqual(41)
      expect(activitiesApiClient.getScheduledPrisonLocations).toHaveBeenCalledWith('EDI', '10001', '2022-08-01', user)
    })
  })

  describe('getActivitySchedules', () => {
    it('should fetch activity schedules using the activities API', async () => {
      const criteria = { prisonerNumbers: ['G4793VF'] }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(prisonerSearchApiClient.searchByPrisonerNumbers).calledWith(criteria, user).mockResolvedValue(prisoners)

      when(activitiesApiClient.getActivitySchedules)
        .calledWith(atLeast('10001'))
        .mockResolvedValueOnce(activitySchedules)
      when(activitiesApiClient.getActivitySchedules).calledWith(atLeast('10001')).mockResolvedValueOnce([])

      const results = await activitiesService.getActivitySchedules('MDI', '10001', '2022-08-01', 'AM', user)

      expect(results.length).toEqual(1)
      expect(activitiesApiClient.getActivitySchedules).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', user)
      expect(results[0]).toEqual(activityScheduleAllocation[1])
    })
  })
})
