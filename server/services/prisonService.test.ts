import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonService from './prisonService'
import { InmateDetail, ReferenceCode } from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'
import activityLocations from './fixtures/activity_locations_1.json'
import IncentivesApiClient from '../data/incentivesApiClient'
import { IepLevel } from '../@types/incentivesApi/types'
import { LocationLenient } from '../@types/prisonApiImportCustom'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/incentivesApiClient')

describe('Prison Service', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const incentivesApiClient = new IncentivesApiClient()
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient)

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  describe('getInmate', () => {
    it('should get inmate detail from prison API', async () => {
      const expectedResult = { data: 'response' } as unknown as InmateDetail

      when(prisonApiClient.getInmateDetail).calledWith(atLeast('ABC123')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getInmate('ABC123', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getInmateDetail).toHaveBeenCalledWith('ABC123', user)
    })
  })

  describe('getIncentiveLevels', () => {
    it('should get the prisons incentive levels from incentives API', async () => {
      const apiResponse = [
        { id: 1, active: false },
        { id: 2, active: true, sequence: 1 },
        { id: 3, active: true, sequence: 0 },
      ] as unknown as IepLevel[]

      when(incentivesApiClient.getIncentiveLevels).calledWith(atLeast('MDI')).mockResolvedValue(apiResponse)

      const actualResult = await prisonService.getIncentiveLevels('MDI', user)

      expect(actualResult).toEqual([
        { id: 3, active: true, sequence: 0 },
        { id: 2, active: true, sequence: 1 },
      ])
      expect(incentivesApiClient.getIncentiveLevels).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('searchInmates', () => {
    it('should search inmates using prisoner search API', async () => {
      const searchCriteria = { lastName: 'Smith' } as PrisonerSearchCriteria
      const expectedResult = [{ data: 'response' }] as unknown as Prisoner[]

      when(prisonerSearchApiClient.searchInmates).calledWith(atLeast(searchCriteria)).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.searchInmates(searchCriteria, user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonerSearchApiClient.searchInmates).toHaveBeenCalledWith(searchCriteria, user)
    })
  })

  describe('searchPrisonInmates', () => {
    it('should search inmates using prisoner search API', async () => {
      const searchQuery = 'G10'
      const expectedResult = { content: 'response' } as unknown as PagePrisoner
      when(prisonerSearchApiClient.searchPrisonInmates)
        .calledWith(searchQuery, 'MDI', user)
        .mockResolvedValue(expectedResult)

      const actualResult = await prisonService.searchPrisonInmates(searchQuery, user)
      expect(actualResult).toEqual(expectedResult)
      expect(prisonerSearchApiClient.searchPrisonInmates).toHaveBeenCalledWith(searchQuery, 'MDI', user)
    })
  })

  describe('getEventLocations', () => {
    it('should get the prisons event locations from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as LocationLenient[]

      when(prisonApiClient.getEventLocations).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getEventLocations('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getEventLocations).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getLocationsForAppointments', () => {
    it('should get the prisons event locations from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as LocationLenient[]

      when(prisonApiClient.getLocationsForEventType).calledWith(atLeast('MDI', 'APP')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getLocationsForAppointments('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getLocationsForEventType).toHaveBeenCalledWith('MDI', 'APP', user)
    })
  })

  describe('searchActivityLocations', () => {
    it('should search activity locations using prisoner search API', async () => {
      when(prisonApiClient.searchActivityLocations).calledWith(atLeast('10001')).mockResolvedValue(activityLocations)
      const locations = await prisonService.searchActivityLocations('EDI', '10001', '2022-08-01', user)
      expect(locations.length).toEqual(3)
      expect(prisonApiClient.searchActivityLocations).toHaveBeenCalledWith('EDI', '10001', '2022-08-01', user)
    })
  })

  describe('getReferenceCodes', () => {
    it('should get the reference codes for the supplied domain from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as ReferenceCode[]

      when(prisonApiClient.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getReferenceCodes('EDU_LEVEL', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getReferenceCodes).toHaveBeenCalledWith('EDU_LEVEL', user)
    })
  })
})
