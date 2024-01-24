import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonService from './prisonService'
import { AgencyPrisonerPayProfile, ReferenceCode } from '../@types/prisonApiImport/types'
import { PagePrisoner, Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'
import IncentivesApiClient from '../data/incentivesApiClient'
import { LocationLenient } from '../@types/prisonApiImportCustom'
import { IncentiveLevel } from '../@types/incentivesApi/types'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/incentivesApiClient')

describe('Prison Service', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const incentivesApiClient = new IncentivesApiClient() as jest.Mocked<IncentivesApiClient>
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient)

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  describe('getIncentiveLevels', () => {
    it('should get the prisons incentive levels from incentives API', async () => {
      const apiResponse = [{ id: 1, active: false }] as unknown as IncentiveLevel[]

      when(incentivesApiClient.getIncentiveLevels).calledWith(atLeast('MDI')).mockResolvedValue(apiResponse)

      const actualResult = await prisonService.getIncentiveLevels('MDI', user)

      expect(actualResult).toEqual([{ id: 1, active: false }])
      expect(incentivesApiClient.getIncentiveLevels).toHaveBeenCalledWith('MDI', user)
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

  describe('searchInmatesByPrisonerNumbers', () => {
    it('should search inmates using prisoner search API', async () => {
      const expectedResult = [{ content: 'response' }] as unknown as Prisoner[]
      when(prisonerSearchApiClient.searchByPrisonerNumbers)
        .calledWith({ prisonerNumbers: ['ABC123'] }, user)
        .mockResolvedValue(expectedResult)

      const actualResult = await prisonService.searchInmatesByPrisonerNumbers(['ABC123'], user)
      expect(actualResult).toEqual(expectedResult)
    })

    it('should batch up large requests', async () => {
      prisonerSearchApiClient.searchByPrisonerNumbers = jest.fn()
      const requestedPrisonerNumbers = Array(1500)
        .fill(0)
        .map((v, i) => String(i))

      const expectedResult = [{ content: 'response' }] as unknown as Prisoner[]
      when(prisonerSearchApiClient.searchByPrisonerNumbers).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.searchInmatesByPrisonerNumbers(requestedPrisonerNumbers, user)
      expect(actualResult).toEqual([expectedResult, expectedResult].flat())
      expect(prisonerSearchApiClient.searchByPrisonerNumbers).toBeCalledTimes(2)
    })

    it('should not request duplicates multiple times', async () => {
      const expectedResult = [{ content: 'response' }] as unknown as Prisoner[]
      when(prisonerSearchApiClient.searchByPrisonerNumbers)
        .calledWith({ prisonerNumbers: ['ABC123'] }, user)
        .mockResolvedValue(expectedResult)

      const actualResult = await prisonService.searchInmatesByPrisonerNumbers(['ABC123', 'ABC123'], user)
      expect(actualResult).toEqual(expectedResult)
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

  describe('getReferenceCodes', () => {
    it('should get the reference codes for the supplied domain from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as ReferenceCode[]

      when(prisonApiClient.getReferenceCodes).calledWith(atLeast('EDU_LEVEL')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getReferenceCodes('EDU_LEVEL', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getReferenceCodes).toHaveBeenCalledWith('EDU_LEVEL', user)
    })
  })

  describe('getPayProfile', () => {
    it('should get the pay profile for the prison from the prisons API', async () => {
      const expectedResult = [{ data: 'response' }] as unknown as AgencyPrisonerPayProfile

      when(prisonApiClient.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getPayProfile('MDI')

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getPayProfile).toHaveBeenCalledWith('MDI')
    })
  })
})
