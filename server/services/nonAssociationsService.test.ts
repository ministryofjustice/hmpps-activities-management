import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import NonAssociationsApiClient from '../data/nonAssociationsApiClient'
import { ServiceUser } from '../@types/express'
import { NonAssociation } from '../@types/nonAssociationsApi/types'
import NonAssociationsService from './nonAssociationsService'

jest.mock('../data/nonAssociationsApiClient')

describe('NonAssociationsService', () => {
  const nonAssociationsApiClient = new NonAssociationsApiClient()
  const nonAssociationsService = new NonAssociationsService(nonAssociationsApiClient)

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
})
