import PrisonApiClient from '../data/prisonApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ServiceUser } from '../@types/express'
import UnlockListService from './unlockListService'
import { PagePrisoner } from '../@types/prisonerOffenderSearchImport/types'
import { PrisonerScheduledEvents } from '../@types/activitiesAPI/types'
import { UnlockFilterItem, UnlockFilters } from '../@types/activities'

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

  const scheduledEvents = {
    prisonCode: 'MDI',
    startDate: '',
    endDate: '',
    appointments: [],
    visits: [],
    courtHearings: [],
    activities: [],
  } as PrisonerScheduledEvents

  const testUnlockFilters = (): UnlockFilters => {
    const subLocations = [
      { value: 'All', text: 'All', checked: false } as UnlockFilterItem,
      { value: 'A-Wing', text: 'A-Wing', checked: true } as UnlockFilterItem,
      { value: 'B-Wing', text: 'B-Wing', checked: false } as UnlockFilterItem,
    ]
    const activityNames = [{ value: 'All', text: 'All', checked: true }] as UnlockFilterItem[]
    const stayingOrLeaving = [{ value: 'All', text: 'All', checked: true }] as UnlockFilterItem[]
    return { subLocations, activityNames, stayingOrLeaving }
  }

  const unlockListService = new UnlockListService(prisonApiClient, prisonerSearchApiClient, activitiesApiClient)

  describe('getUnlockListForLocationGroups', () => {
    it('should get the unlock list items for one sub-location', async () => {
      const prisonerNumbers = ['A1234AA']

      activitiesApiClient.getPrisonLocationPrefixByGroup
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-2-0(0[1-9]|1[0-2])' })

      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValue(prisoners)
      activitiesApiClient.getScheduledEventsByPrisonerNumbers.mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        'HB1',
        ['A-Wing'],
        testUnlockFilters(),
        '2022-10-01',
        'AM',
        user,
      )

      expect(unlockListItems.length).toBe(1)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(2)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_A-Wing', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-1-1',
        0,
        1024,
        user,
      )

      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        'MDI',
        '2022-10-01',
        prisonerNumbers,
        user,
        'AM',
      )
    })

    it('should get the unlock list items for two sub-location groups', async () => {
      activitiesApiClient.getPrisonLocationPrefixByGroup
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2])' })

      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValueOnce(prisoners)
      activitiesApiClient.getScheduledEventsByPrisonerNumbers.mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        'HB1',
        ['A-Wing', 'B-Wing'],
        testUnlockFilters(),
        '2022-10-01',
        'AM',
        user,
      )

      expect(unlockListItems.length).toBe(1)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(3)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_A-Wing', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_B-Wing', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-1-1',
        0,
        1024,
        user,
      )

      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        'MDI',
        '2022-10-01',
        ['A1234AA'],
        user,
        'AM',
      )
    })

    it('should return an empty list when no prisoners are located in the location groups', async () => {
      const prisonerNumbers: string[] = []

      activitiesApiClient.getPrisonLocationPrefixByGroup
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-1' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-1-0(0[1-9]|1[0-2])' })

      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValue(emptyPrisoners)
      activitiesApiClient.getScheduledEventsByPrisonerNumbers.mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        'HB3',
        ['C-Wing'],
        testUnlockFilters(),
        '2022-10-02',
        'PM',
        user,
      )

      expect(unlockListItems.length).toBe(0)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(2)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB3', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB3_C-Wing', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        'MDI',
        'MDI-3-1',
        0,
        1024,
        user,
      )

      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        'MDI',
        '2022-10-02',
        prisonerNumbers,
        user,
        'PM',
      )
    })
  })
})
