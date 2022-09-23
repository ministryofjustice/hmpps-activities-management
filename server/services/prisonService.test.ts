import { when } from 'jest-when'
import atLeast from '../../jest.setup'

import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonService from './prisonService'
import PrisonRegisterApiClient from '../data/prisonRegisterApiClient'
import { Prison } from '../@types/prisonRegisterApiImport/types'
import { InmateDetail } from '../@types/prisonApiImport/types'
import { Prisoner, PrisonerSearchCriteria } from '../@types/prisonerOffenderSearchImport/types'
import { ServiceUser } from '../@types/express'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/prisonRegisterApiClient')

describe('Prison Service', () => {
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const prisonRegisterApiClient = new PrisonRegisterApiClient() as jest.Mocked<PrisonRegisterApiClient>
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, prisonRegisterApiClient)

  const user = {} as ServiceUser

  describe('getPrison', () => {
    it('should get prison information from prison register API', async () => {
      const expectedResult = { prisonId: 'MDI', prisonName: 'HMP Moorland' } as Prison

      when(prisonRegisterApiClient.getPrison).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getPrison('MDI', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonRegisterApiClient.getPrison).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getInmate', () => {
    it('should get inmate detail from prison API', async () => {
      const expectedResult = { data: 'response' } as unknown as InmateDetail

      when(prisonApiClient.getInmateDetail).calledWith(atLeast('ABC123')).mockResolvedValue(expectedResult)

      const actualResult = await prisonService.getInmate('ABC123', user)

      expect(actualResult).toEqual(expectedResult)
      expect(prisonApiClient.getInmateDetail).toHaveBeenCalledWith('ABC123', user)
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
})
