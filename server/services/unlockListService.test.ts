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

const scheduledEvents = {
  prisonCode: 'MDI',
  startDate: '',
  endDate: '',
  appointments: [],
  visits: [],
  courtHearings: [],
  activities: [],
} as PrisonerScheduledEvents

const locationFiltersDefault = [
  { value: 'A-Wing', text: 'A-Wing', checked: true },
  { value: 'B-Wing', text: 'B-Wing', checked: true },
  { value: 'C-Wing', text: 'C-Wing', checked: true },
] as UnlockFilterItem[]

const activityFiltersDefault = [
  { value: 'Both', text: 'Both', checked: true },
  { value: 'With', text: 'With', checked: false },
  { value: 'Without', text: 'Without', checked: false },
] as UnlockFilterItem[]

const stayingOrLeavingFiltersDefault = [
  { value: 'Both', text: 'Both', checked: true },
  { value: 'Staying', text: 'Staying', checked: false },
  { value: 'Leaving', text: 'Leaving', checked: false },
] as UnlockFilterItem[]

const testUnlockFilters = (
  locationFilters: UnlockFilterItem[] = locationFiltersDefault,
  activityFilters: UnlockFilterItem[] = activityFiltersDefault,
  stayingOrLeavingFilters: UnlockFilterItem[] = stayingOrLeavingFiltersDefault,
): UnlockFilters => {
  return {
    location: 'HB1',
    cellPrefix: 'MDI-1-',
    unlockDate: '2022-01-01',
    timeSlot: 'am',
    formattedDate: '',
    subLocations: ['A-Wing', 'B-Wing', 'C-Wing'],
    locationFilters,
    activityFilters,
    stayingOrLeavingFilters,
  } as UnlockFilters
}

afterEach(() => {
  jest.resetAllMocks()
})

beforeEach(() => {
  // Mocked the cell location pattern matchers for A-Wing, B-Wing and C-Wing
  activitiesApiClient.getPrisonLocationPrefixByGroup
    .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })
    .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })
    .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })
})

describe('Unlock list service', () => {
  const unlockListService = new UnlockListService(prisonApiClient, prisonerSearchApiClient, activitiesApiClient)

  describe('getUnlockListForLocationGroups', () => {
    it('should get the unlock list items for three sub-locations', async () => {
      const prisonerNumbers = ['A1234AA']
      const unlockFilters = testUnlockFilters()

      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValue(prisoners)
      activitiesApiClient.getScheduledEventsByPrisonerNumbers.mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems.length).toBe(1)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(3)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_A-Wing', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_B-Wing', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_C-Wing', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        unlockFilters.cellPrefix,
        0,
        1024,
        user,
      )

      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        unlockFilters.unlockDate,
        prisonerNumbers,
        user,
        unlockFilters.timeSlot,
      )
    })

    it('should return an empty list when no prisoners are in the sub-locations', async () => {
      const prisonerNumbers: string[] = []
      const locationFilters = [
        { value: 'A-Wing', text: 'A-Wing', checked: false },
        { value: 'B-Wing', text: 'B-Wing', checked: false },
        { value: 'C-Wing', text: 'C-Wing', checked: true },
      ] as UnlockFilterItem[]

      const unlockFilters = testUnlockFilters(locationFilters)

      // These do not match any cell patterns for prisoners in the mocked list
      activitiesApiClient.getPrisonLocationPrefixByGroup
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-1-0(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-2-0(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-3-0(0[1-9]|1[0-2])' })

      prisonerSearchApiClient.searchPrisonersByLocationPrefix.mockResolvedValue(prisoners)
      activitiesApiClient.getScheduledEventsByPrisonerNumbers.mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems.length).toBe(0)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(3)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        unlockFilters.unlockDate,
        prisonerNumbers,
        user,
        unlockFilters.timeSlot,
      )
    })
  })
})
