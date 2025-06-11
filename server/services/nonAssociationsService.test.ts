import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import NonAssociationsApiClient from '../data/nonAssociationsApiClient'
import { ServiceUser } from '../@types/express'
import { NonAssociation, PrisonerNonAssociations } from '../@types/nonAssociationsApi/types'
import NonAssociationsService from './nonAssociationsService'
import PrisonService from './prisonService'

jest.mock('../data/nonAssociationsApiClient')
jest.mock('../services/prisonService')

describe('NonAssociationsService', () => {
  const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
  const nonAssociationsApiClient = new NonAssociationsApiClient()
  const nonAssociationsService = new NonAssociationsService(nonAssociationsApiClient, prisonService)

  const user = {
    activeCaseLoadId: 'MDI',
  } as ServiceUser

  describe('getNonAssociationsBetween', () => {
    it('should get non-associations from the non-associations API', async () => {
      const apiResponse: NonAssociation[] = [
        {
          id: 0,
          firstPrisonerNumber: 'AA1111AA',
          firstPrisonerRole: 'VICTIM',
          firstPrisonerRoleDescription: 'Victim',
          secondPrisonerNumber: 'JJ3333J',
          secondPrisonerRole: 'PERPETRATOR',
          secondPrisonerRoleDescription: 'Perpetrator',
          reason: 'BULLYING',
          reasonDescription: 'Bullying',
          restrictionType: 'CELL',
          restrictionTypeDescription: 'Cell',
          comment: 'Comment 1',
          whenCreated: '2024-10-09T11:34:45',
          whenUpdated: '2024-10-09T12:34:45',
          updatedBy: 'SCH_ACTIVITY',
          isClosed: false,
          isOpen: true,
        },
      ]

      const prisonerNumbers = ['AA1111A', 'BB2222B']

      when(nonAssociationsApiClient.getNonAssociationsBetween)
        .calledWith(atLeast(prisonerNumbers))
        .mockResolvedValue(apiResponse)

      const actualResult = await nonAssociationsService.getNonAssociationsBetween(prisonerNumbers, user)

      expect(actualResult).toEqual(apiResponse)
      expect(nonAssociationsApiClient.getNonAssociationsBetween).toHaveBeenCalledWith(prisonerNumbers, user)
    })
  })
  describe('getNonAssociationByPrisonerId', () => {
    it('should get non-associations for a prisoner', async () => {
      const mockNonAssociation = {
        id: 51510,
        role: 'NOT_RELEVANT',
        reason: 'GANG_RELATED',
        restrictionType: 'WING',
        restrictionTypeDescription: 'Cell, landing and wing',
        otherPrisonerDetails: {
          prisonerNumber: 'G6512VC',
          firstName: 'John',
          lastName: 'Smith',
          cellLocation: '1-2-002',
        },
        isOpen: true,
      } as unknown as PrisonerNonAssociations

      when(nonAssociationsApiClient.getNonAssociationsByPrisonerNumber)
        .calledWith(atLeast('AA1111A'))
        .mockResolvedValue(mockNonAssociation)

      const actualResult = await nonAssociationsService.getNonAssociationByPrisonerId('AA1111A', user)

      expect(actualResult).toEqual(mockNonAssociation)
      expect(nonAssociationsApiClient.getNonAssociationsByPrisonerNumber).toHaveBeenCalledWith('AA1111A', user)
    })
  })
})
