import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import { formatDate, toDate } from '../utils/utils'
import PrisonApiClient from '../data/prisonApiClient'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ServiceUser } from '../@types/express'
import UnlockListService from './unlockListService'
import { PagePrisoner } from '../@types/prisonerOffenderSearchImport/types'
import { PrisonerScheduledEvents } from '../@types/activitiesAPI/types'
import { FilterItem, UnlockFilters } from '../@types/activities'

jest.mock('../data/prisonApiClient')
jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>

const user = { activeCaseLoadId: 'MDI' } as ServiceUser

const prisoners = {
  totalPages: 1,
  totalElements: 2,
  pages: 1,
  size: 2,
  first: true,
  numberOfElements: 2,
  content: [
    {
      prisonerNumber: 'A1111AA',
      bookingId: '111111',
      firstName: 'One',
      lastName: 'Onester',
      dateOfBirth: '2002-10-01',
      gender: 'Male',
      youthOffender: false,
      maritalStatus: 'Single',
      religion: 'None',
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
    {
      prisonerNumber: 'A2222AA',
      bookingId: '222222',
      firstName: 'Two',
      lastName: 'Twoster',
      dateOfBirth: '2002-10-01',
      gender: 'Male',
      youthOffender: false,
      maritalStatus: 'Single',
      religion: 'None',
      nationality: 'British',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-2-002',
      category: 'C',
      legalStatus: 'SENTENCED',
      mostSeriousOffence: 'Driving without due care',
    },
  ],
} as unknown as PagePrisoner

const scheduledEvents = {
  prisonCode: 'MDI',
  startDate: '2022-01-01',
  endDate: '2022-01-01',
  appointments: [],
  visits: [],
  courtHearings: [],
  externalTransfers: [],
  adjudications: [],
  activities: [],
} as PrisonerScheduledEvents

const scheduledEventsWithActivities = {
  prisonCode: 'MDI',
  startDate: '2022-01-01',
  endDate: '2022-01-01',
  appointments: [],
  visits: [],
  courtHearings: [],
  adjudications: [],
  externalTransfers: [],
  activities: [
    {
      prisonCode: 'MDI',
      eventSource: 'SAA',
      eventType: 'ACTIVITY',
      bookingId: 10001,
      internalLocationId: 10001,
      internalLocationCode: 'MDI-WORKSHOP-1',
      internalLocationDescription: 'WORKSHOP 1',
      scheduledInstanceId: 1001,
      categoryCode: 'SAA-PRISON_INDUSTRIES',
      categoryDescription: 'Prison industries',
      summary: 'Metalwork',
      prisonerNumber: 'A1111AA',
      date: '2022-01-01',
      startTime: '9:00',
      endTime: '11:30',
      priority: 4,
    },
  ],
} as PrisonerScheduledEvents

const scheduledEventsWithCourt = {
  prisonCode: 'MDI',
  startDate: '',
  endDate: '',
  appointments: [],
  visits: [],
  adjudications: [],
  externalTransfers: [],
  courtHearings: [
    {
      prisonCode: 'MDI',
      eventSource: 'NOMIS',
      eventType: 'COURT_HEARING',
      eventId: 10001,
      bookingId: 10001,
      internalLocationDescription: 'Bradford County Court',
      summary: 'Court hearing',
      prisonerNumber: 'A1111AA',
      date: '2022-01-01',
      startTime: '9:00',
      endTime: '17:00',
      priority: 1,
    },
  ],
  activities: [],
} as PrisonerScheduledEvents

const defaultLocationFilters = [
  { value: 'A-Wing', text: 'A-Wing', checked: true },
  { value: 'B-Wing', text: 'B-Wing', checked: true },
  { value: 'C-Wing', text: 'C-Wing', checked: true },
] as FilterItem[]

const defaultActivityFilters = [
  { value: 'Both', text: 'Both', checked: true },
  { value: 'With', text: 'With', checked: false },
  { value: 'Without', text: 'Without', checked: false },
] as FilterItem[]

const defaultStayingOrLeavingFilters = [
  { value: 'Both', text: 'Both', checked: true },
  { value: 'Staying', text: 'Staying', checked: false },
  { value: 'Leaving', text: 'Leaving', checked: false },
] as FilterItem[]

const testUnlockFilters = (
  locationFilters: FilterItem[],
  activityFilters: FilterItem[],
  stayingOrLeavingFilters: FilterItem[],
): UnlockFilters => {
  return {
    location: 'HB1',
    cellPrefix: 'MDI-1-',
    unlockDate: toDate('2022-01-01'),
    timeSlot: 'am',
    subLocations: ['A-Wing', 'B-Wing', 'C-Wing'],
    locationFilters,
    activityFilters,
    stayingOrLeavingFilters,
  } as UnlockFilters
}

const unlockListService = new UnlockListService(prisonApiClient, prisonerSearchApiClient, activitiesApiClient)

describe('Unlock list service', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUnlockListForLocationGroups', () => {
    it('should get the unlock list items for three sub-locations', async () => {
      const prisonerNumbers = ['A1111AA', 'A2222AA']
      const unlockFilters = testUnlockFilters(
        defaultLocationFilters,
        defaultActivityFilters,
        defaultStayingOrLeavingFilters,
      )

      // Mocked the cell location pattern matchers for A-Wing, B-Wing and C-Wing
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(prisoners)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems.length).toBe(2)

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
        formatDate(unlockFilters.unlockDate, 'yyyy-MM-dd'),
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
      ] as FilterItem[]

      const unlockFilters = testUnlockFilters(locationFilters, defaultActivityFilters, defaultStayingOrLeavingFilters)

      // These do not match any cell patterns for prisoners in the mocked list
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-1-0(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-2-0(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-3-3-0(0[1-9]|1[0-2])' })

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(prisoners)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems.length).toBe(0)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(3)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        formatDate(unlockFilters.unlockDate, 'yyyy-MM-dd'),
        prisonerNumbers,
        user,
        unlockFilters.timeSlot,
      )
    })
  })

  describe('unlock list filters', () => {
    it('filter by activities', async () => {
      const activityFilters = [
        { value: 'Both', text: 'Both', checked: false },
        { value: 'With', text: 'With', checked: true },
        { value: 'Without', text: 'Without', checked: false },
      ] as FilterItem[]

      const unlockFilters = testUnlockFilters(defaultLocationFilters, activityFilters, defaultStayingOrLeavingFilters)

      // Mocked the cell location pattern matchers for A-Wing, B-Wing and C-Wing
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(prisoners)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(scheduledEventsWithActivities)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems).toHaveLength(1)
      expect(unlockListItems[0].prisonerNumber).toEqual('A1111AA')
    })

    it('filter by leaving', async () => {
      const stayingOrLeavingFilters = [
        { value: 'Both', text: 'Both', checked: false },
        { value: 'Staying', text: 'Staying', checked: false },
        { value: 'Leaving', text: 'Leaving', checked: true },
      ] as FilterItem[]

      const unlockFilters = testUnlockFilters(defaultLocationFilters, defaultActivityFilters, stayingOrLeavingFilters)

      // Mocked the cell location pattern matchers for A-Wing, B-Wing and C-Wing
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(prisoners)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(scheduledEventsWithCourt)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems).toHaveLength(1)
      expect(unlockListItems[0].prisonerNumber).toEqual('A1111AA')
    })

    it('filter by staying', async () => {
      const stayingOrLeavingFilters = [
        { value: 'Both', text: 'Both', checked: false },
        { value: 'Staying', text: 'Staying', checked: true },
        { value: 'Leaving', text: 'Leaving', checked: false },
      ] as FilterItem[]

      const unlockFilters = testUnlockFilters(defaultLocationFilters, defaultActivityFilters, stayingOrLeavingFilters)

      // Mocked the cell location pattern matchers for A-Wing, B-Wing and C-Wing
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(prisoners)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(scheduledEventsWithCourt)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems).toHaveLength(1)
      expect(unlockListItems[0].prisonerNumber).toEqual('A2222AA')
    })

    it('filter by sub-location', async () => {
      const locationFilters = [
        { value: 'A-Wing', text: 'A-Wing', checked: true },
        { value: 'B-Wing', text: 'B-Wing', checked: false },
        { value: 'C-Wing', text: 'C-Wing', checked: false },
      ] as FilterItem[]

      const unlockFilters = testUnlockFilters(locationFilters, defaultActivityFilters, defaultStayingOrLeavingFilters)

      // Mocked the cell location pattern matchers for A-Wing, B-Wing and C-Wing
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })
        .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(prisoners)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue(scheduledEventsWithCourt)

      const unlockListItems = await unlockListService.getFilteredUnlockList(unlockFilters, user)

      expect(unlockListItems).toHaveLength(1)
      expect(unlockListItems[0].prisonerNumber).toEqual('A1111AA')
    })
  })
})
