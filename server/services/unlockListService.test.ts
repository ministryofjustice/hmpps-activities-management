import PrisonApiClient from '../data/prisonApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ServiceUser } from '../@types/express'
import UnlockListService from './unlockListService'
import { PagePrisoner } from '../@types/prisonerOffenderSearchImport/types'

jest.mock('../data/prisonApiClient')
jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

afterEach(() => {
  jest.resetAllMocks()
})

describe('Unlock list service', () => {
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const user = { activeCaseLoadId: 'MDI' } as ServiceUser
  const prisoners = {
    totalPages: 1,
    totalElements: 1,
    pages: 1,
    size: 1,
    first: true,
    numberOfElements: 1,
    content: [
      {
        prisonerNumber: 'A1234AA',
        bookingId: '123456',
        firstName: 'Test',
        lastName: 'Tester',
        dateOfBirth: '2002-10-01',
        gender: 'Male',
        ethnicity: '',
        youthOffender: false,
        maritalStatus: 'Single',
        religion: 'Jedi',
        nationality: 'British',
        status: 'ACTIVE IN',
        inOutStatus: 'IN',
        prisonId: 'MDI',
        prisonName: 'HMP Moorland',
        cellLocation: '1-1-001',
        category: 'C',
        legalStatus: 'SENTENCED',
        mostSeriousOffence: 'Driving without due care',
      },
    ],
  } as unknown as PagePrisoner

  const emptyPrisoners = {
    totalPages: 0,
    totalElements: 0,
    pages: 0,
    size: 0,
    first: false,
    empty: true,
    numberOfElements: 0,
    content: [],
  } as unknown as PagePrisoner

  const unlockListService = new UnlockListService(prisonApiClient, prisonerSearchApiClient, activitiesApiClient)

  describe('getUnlockListForLocationGroups', () => {
    it('should get the unlock list items for one location group', async () => {
      activitiesApiClient.getPrisonLocationPrefixByGroup.mockResolvedValue({ locationPrefix: 'MDI-1-' })
      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValue(prisoners)

      const unlockListItems = await unlockListService.getUnlockListForLocationGroups(['HB1'], '2022-10-01', 'AM', user)

      expect(unlockListItems.length).toBe(0)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-1-',
        0,
        1024,
        user,
      )
    })

    it('should get the unlock list items for two location groups', async () => {
      activitiesApiClient.getPrisonLocationPrefixByGroup
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-2-' })

      prisonerSearchApiClient.searchPrisonersByLocationPrefix
        .mockResolvedValueOnce(prisoners)
        .mockResolvedValueOnce(prisoners)

      const unlockListItems = await unlockListService.getUnlockListForLocationGroups(
        ['HB1', 'HB2'],
        '2022-10-01',
        'AM',
        user,
      )

      expect(unlockListItems.length).toBe(0)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(2)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB2', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(2)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-1-',
        0,
        1024,
        user,
      )
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-2-',
        0,
        1024,
        user,
      )
    })

    it('should return an empty list when no prisoners are located in the location groups', async () => {
      activitiesApiClient.getPrisonLocationPrefixByGroup.mockResolvedValue({ locationPrefix: 'MDI-3-' })
      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValue(emptyPrisoners)

      const unlockListItems = await unlockListService.getUnlockListForLocationGroups(['HB3'], '2022-10-02', 'PM', user)

      expect(unlockListItems.length).toBe(0)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB3', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-3-',
        0,
        1024,
        user,
      )
    })
  })
})
