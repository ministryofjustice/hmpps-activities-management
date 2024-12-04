import { when } from 'jest-when'
import _, { cloneDeep } from 'lodash'
import { subDays } from 'date-fns'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { ServiceUser } from '../@types/express'
import UnlockListService from './unlockListService'
import { PagePrisoner, PrisonerAlert } from '../@types/prisonerOffenderSearchImport/types'
import { ActivityCategory, PrisonerScheduledEvents, ScheduledEvent } from '../@types/activitiesAPI/types'
import atLeast from '../../jest.setup'
import AlertsFilterService from './alertsFilterService'
import { AppointmentFrequency } from '../@types/appointments'
import { toDateString } from '../utils/utils'
import activityCategories from './fixtures/activity_categories.json'
import { EventType, YesNo } from '../@types/activities'

jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../services/alertsFilterService')

const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
const alertsFilterService = new AlertsFilterService() as jest.Mocked<AlertsFilterService>

const user = { activeCaseLoadId: 'MDI' } as ServiceUser

const prisoners = {
  totalPages: 1,
  totalElements: 4,
  pages: 1,
  size: 4,
  first: true,
  numberOfElements: 4,
  content: [
    {
      prisonerNumber: 'A1111AA',
      bookingId: '111111',
      firstName: 'One',
      lastName: 'Onester',
      dateOfBirth: '2002-10-01',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-1-001',
      category: 'A',
      legalStatus: 'SENTENCED',
    },
    {
      prisonerNumber: 'A2222AA',
      bookingId: '222222',
      firstName: 'Two',
      lastName: 'Twoster',
      dateOfBirth: '2002-10-01',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-2-002',
      category: 'E',
      alerts: [{ alertCode: 'HA' }, { alertCode: 'PEEP' }],
      legalStatus: 'SENTENCED',
    },
    {
      prisonerNumber: 'A3333AA',
      bookingId: '333333',
      firstName: 'John',
      lastName: 'Smith',
      dateOfBirth: '2002-10-01',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-2-003',
      category: 'C',
      alerts: [{ alertCode: 'PEEP' }, { alertCode: 'XEL' }],
      legalStatus: 'SENTENCED',
    },
    {
      prisonerNumber: 'A4444AA',
      bookingId: '444444',
      firstName: 'Joe',
      lastName: 'Bloggs',
      dateOfBirth: '2002-10-01',
      status: 'ACTIVE IN',
      inOutStatus: 'IN',
      prisonId: 'MDI',
      prisonName: 'HMP Moorland',
      cellLocation: '1-1-004',
      category: 'P',
      legalStatus: 'SENTENCED',
    },
  ],
} as unknown as PagePrisoner

const emptyScheduledEvents = {
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

const scheduledEvents = {
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
  activities: [
    {
      prisonCode: 'MDI',
      eventSource: 'SAA',
      eventType: 'ACTIVITY',
      bookingId: 10001,
      internalLocationId: 10001,
      internalLocationCode: 'WOW',
      internalLocationDescription: 'WORKSHOP 1 WORKERS',
      onWing: false,
      scheduledInstanceId: 1001,
      categoryCode: 'SAA_INDUSTRIES',
      categoryDescription: 'Prison industries',
      summary: 'Textiles',
      prisonerNumber: 'A2222AA',
      date: '2022-01-01',
      startTime: '9:00',
      endTime: '11:30',
      priority: 4,
    },
    {
      prisonCode: 'MDI',
      eventSource: 'SAA',
      eventType: 'ACTIVITY',
      bookingId: 10002,
      internalLocationId: null,
      internalLocationCode: null,
      internalLocationDescription: null,
      onWing: true,
      scheduledInstanceId: 1002,
      categoryCode: 'SAA_INDUSTRIES',
      categoryDescription: 'Prison industries',
      summary: 'Textiles',
      prisonerNumber: 'A3333AA',
      date: '2022-01-01',
      startTime: '9:00',
      endTime: '11:30',
      priority: 4,
    },
    {
      prisonCode: 'MDI',
      eventSource: 'SAA',
      eventType: 'ACTIVITY',
      bookingId: 10003,
      internalLocationId: 10003,
      internalLocationCode: 'GYM',
      internalLocationDescription: 'GYM',
      onWing: false,
      scheduledInstanceId: 1003,
      categoryCode: 'SAA_GYM_SPORTS_FITNESS',
      categoryDescription: 'Gym, sport, fitness',
      summary: 'Gym - Weights',
      prisonerNumber: 'A4444AA',
      date: '2022-01-01',
      startTime: '9:00',
      endTime: '11:30',
      priority: 4,
    },
  ],
} as PrisonerScheduledEvents

const allActivityCategoriesFilter = activityCategories.map(c => c.code)

const unlockListService = new UnlockListService(prisonerSearchApiClient, activitiesApiClient, alertsFilterService)

describe('Unlock list service', () => {
  beforeEach(() => {
    when(activitiesApiClient.getPrisonLocationPrefixByGroup)
      .calledWith(atLeast('MDI', 'HB1'))
      .mockResolvedValueOnce({ locationPrefix: 'MDI-1-' })

    when(activitiesApiClient.getPrisonLocationPrefixByGroup)
      .calledWith(atLeast('MDI', 'HB1_A-Wing'))
      .mockResolvedValueOnce({ locationPrefix: 'MDI-1-1-0(0[1-9]|1[0-2]),MDI-1-1-1(0[1-9]|1[0-2])' })

    when(activitiesApiClient.getPrisonLocationPrefixByGroup)
      .calledWith(atLeast('MDI', 'HB1_B-Wing'))
      .mockResolvedValueOnce({ locationPrefix: 'MDI-1-2-0(0[1-9]|1[0-2]),MDI-1-2-2(0[1-9]|1[0-2])' })

    when(activitiesApiClient.getPrisonLocationPrefixByGroup)
      .calledWith(atLeast('MDI', 'HB1_C-Wing'))
      .mockResolvedValueOnce({ locationPrefix: 'MDI-1-3-0(0[1-9]|1[0-2]),MDI-1-3-3(0[1-9]|1[0-2])' })

    when(activitiesApiClient.getActivityCategories)
      .calledWith(atLeast('MDI'))
      .mockResolvedValueOnce(activityCategories as ActivityCategory[])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUnlockListForLocationGroups', () => {
    it('should get the unlock list items for three sub-locations', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(emptyScheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'Both',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems.length).toBe(4)

      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(4)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_A-Wing', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_B-Wing', user)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'HB1_C-Wing', user)

      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        'MDI-1-',
        0,
        1024,
        user,
      )

      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        '2022-01-01',
        ['A1111AA', 'A2222AA', 'A3333AA', 'A4444AA'],
        user,
        'AM',
      )
    })

    it('should return an empty list when no prisoners are in the sub-locations', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(emptyScheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['C-Wing'],
        'Both',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems.length).toBe(0)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(2)
      expect(prisonerSearchApiClient.searchPrisonersByLocationPrefix).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledTimes(1)
      expect(activitiesApiClient.getScheduledEventsByPrisonerNumbers).toHaveBeenCalledWith(
        user.activeCaseLoadId,
        '2022-01-01',
        [],
        user,
        'AM',
      )
    })
  })

  describe('unlock list filters', () => {
    it('filter by activities', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(4)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A2222AA', 'A3333AA', 'A4444AA'])
    })

    it('filter by both leaving and staying', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'Both',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(4)
      expect(unlockListItems.filter(i => i.isLeavingWing).length).toBe(2)
      expect(unlockListItems.filter(i => !i.isLeavingWing).length).toBe(2)
    })

    it('filter by leaving', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'Both',
        allActivityCategoriesFilter,
        'Leaving',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(2)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A4444AA'])
    })

    it('filter by staying', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'Both',
        allActivityCategoriesFilter,
        'Staying',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(2)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A2222AA', 'A3333AA'])
    })

    it('filter by sub-location', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing'],
        'Both',
        allActivityCategoriesFilter,
        'Leaving',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(2)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A4444AA'])
    })

    it('filter by sub-location - no-sublocations exist', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        [],
        'Both',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(4)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledTimes(1)
    })

    it('should filter category', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)
      when(alertsFilterService.getFilteredCategory)
        .calledWith(atLeast(['CAT_A'], 'A'))
        .mockReturnValueOnce('A')
      when(alertsFilterService.getFilteredCategory)
        .calledWith(atLeast(['CAT_A'], 'E'))
        .mockReturnValueOnce('E')

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        allActivityCategoriesFilter,
        'Both',
        ['CAT_A'],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A2222AA', 'A3333AA', 'A4444AA'])
      expect(unlockListItems.map(i => i.category)).toEqual(['A', 'E', undefined, undefined])
      expect(unlockListItems.map(i => i.alerts)).toEqual([undefined, undefined, undefined, undefined])
    })

    it('should filter activity category', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)

      const selectedActivityCategories = allActivityCategoriesFilter.filter(cat => cat !== 'SAA_GYM_SPORTS_FITNESS')

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        selectedActivityCategories,
        'Both',
        ['CAT_A'],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(3)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A2222AA', 'A3333AA'])
    })

    it('should filter activity category and include when event category not selected, but the prisoner has another event which is selected', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)

      const unselectedEventForPrisoner = cloneDeep(scheduledEvents)
      unselectedEventForPrisoner.activities.push({
        prisonCode: 'MDI',
        eventSource: 'SAA',
        eventType: 'ACTIVITY',
        bookingId: 10002,
        internalLocationId: null,
        internalLocationCode: null,
        internalLocationDescription: null,
        onWing: true,
        scheduledInstanceId: 1002,
        categoryCode: 'SAA_INDUSTRIES',
        categoryDescription: 'Prison industries',
        summary: 'Textiles',
        prisonerNumber: 'A4444AA',
        date: '2022-01-01',
        startTime: '9:00',
        endTime: '11:30',
        priority: 5,
      } as ScheduledEvent)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(unselectedEventForPrisoner)

      const selectedActivityCategories = allActivityCategoriesFilter.filter(cat => cat !== 'SAA_GYM_SPORTS_FITNESS')

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        selectedActivityCategories,
        'Both',
        ['CAT_A'],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(4)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A2222AA', 'A3333AA', 'A4444AA'])
      const multiplePrisonerEvents = unlockListItems.find(item => item.prisonerNumber === 'A4444AA').events
      expect(multiplePrisonerEvents).toEqual([
        {
          bookingId: 10003,
          categoryCode: 'SAA_GYM_SPORTS_FITNESS',
          categoryDescription: 'Gym, sport, fitness',
          date: '2022-01-01',
          endTime: '11:30',
          eventSource: 'SAA',
          eventType: 'ACTIVITY',
          internalLocationCode: 'GYM',
          internalLocationDescription: 'GYM',
          internalLocationId: 10003,
          onWing: false,
          priority: 4,
          prisonCode: 'MDI',
          prisonerNumber: 'A4444AA',
          scheduledInstanceId: 1003,
          startTime: '9:00',
          summary: 'Gym - Weights',
        },
        {
          bookingId: 10002,
          categoryCode: 'SAA_INDUSTRIES',
          categoryDescription: 'Prison industries',
          date: '2022-01-01',
          endTime: '11:30',
          eventSource: 'SAA',
          eventType: 'ACTIVITY',
          internalLocationCode: null,
          internalLocationDescription: null,
          internalLocationId: null,
          onWing: true,
          priority: 5,
          prisonCode: 'MDI',
          prisonerNumber: 'A4444AA',
          scheduledInstanceId: 1002,
          startTime: '9:00',
          summary: 'Textiles',
        },
      ])
    })

    it('should filter activity category and not include when event category not selected and the prisoner does not have another event which is selected', async () => {
      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)

      const unselectedEventForPrisoner2 = cloneDeep(scheduledEvents)
      unselectedEventForPrisoner2.activities.push({
        prisonCode: 'MDI',
        eventSource: 'SAA',
        eventType: 'ACTIVITY',
        bookingId: 10002,
        internalLocationId: null,
        internalLocationCode: null,
        internalLocationDescription: null,
        onWing: true,
        scheduledInstanceId: 1002,
        categoryCode: 'SAA_PRISON_JOBS',
        categoryDescription: 'Prison industries',
        summary: 'Textiles',
        prisonerNumber: 'A4444AA',
        date: '2022-01-01',
        startTime: '9:00',
        endTime: '11:30',
        priority: 5,
      } as ScheduledEvent)

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(unselectedEventForPrisoner2)

      const selectedActivityCategories = allActivityCategoriesFilter.filter(
        cat => cat !== 'SAA_GYM_SPORTS_FITNESS' && cat !== 'SAA_PRISON_JOBS',
      )

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        selectedActivityCategories,
        'Both',
        ['CAT_A'],
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems).toHaveLength(3)
      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A2222AA', 'A3333AA'])
    })

    it('should filter alerts', async () => {
      const alertFilters = ['ALERT_PEEP', 'ALERT_HA']
      const mockFilteredAlerts1 = [{ alertCode: 'HA' }, { alertCode: 'PEEP' }] as PrisonerAlert[]
      const mockFilteredAlerts2 = [{ alertCode: 'PEEP' }] as PrisonerAlert[]

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(scheduledEvents)
      when(alertsFilterService.getFilteredAlerts)
        .calledWith(atLeast(alertFilters, [{ alertCode: 'HA' }, { alertCode: 'PEEP' }]))
        .mockReturnValueOnce(mockFilteredAlerts1)
      when(alertsFilterService.getFilteredAlerts)
        .calledWith(atLeast(alertFilters, [{ alertCode: 'PEEP' }, { alertCode: 'XEL' }]))
        .mockReturnValueOnce(mockFilteredAlerts2)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        allActivityCategoriesFilter,
        'Both',
        alertFilters,
        null,
        YesNo.YES,
        user,
      )

      expect(unlockListItems.map(i => i.prisonerNumber)).toEqual(['A1111AA', 'A2222AA', 'A3333AA', 'A4444AA'])
      expect(unlockListItems.map(i => i.category)).toEqual([undefined, undefined, undefined, undefined])
      const expectedAlertCodes = unlockListItems
        .map(({ alerts }) => alerts)
        .map(a => (!a ? undefined : _(a).map('alertCode').value()))
      expect(expectedAlertCodes).toEqual([undefined, ['HA', 'PEEP'], ['PEEP'], undefined])
    })

    it('filter cancelled appointments', async () => {
      const appointmentScheduledEvents = {
        prisonCode: 'MDI',
        startDate: '',
        endDate: '',
        appointments: [
          {
            appointmentId: 1234,
            prisonerNumber: 'A1111AA',
            eventType: 'APPOINTMENT',
            autoSuspended: false,
            cancelled: true,
            inCell: false,
            offWing: false,
            onWing: false,
            outsidePrison: false,
            priority: 0,
            startTime: '',
            suspended: false,
            date: toDateString(subDays(new Date(), 2)),
            appointmentSeriesFrequency: AppointmentFrequency.WEEKDAY,
            appointmentSeriesCancellationStartDate: toDateString(subDays(new Date(), 6)),
          },
          {
            appointmentId: 3456,
            prisonerNumber: 'A2222AA',
            eventType: 'APPOINTMENT',
            autoSuspended: false,
            cancelled: true,
            inCell: false,
            offWing: false,
            onWing: false,
            outsidePrison: false,
            priority: 0,
            startTime: '',
            suspended: false,
            date: toDateString(subDays(new Date(), 2)),
            appointmentSeriesFrequency: AppointmentFrequency.WEEKDAY,
            appointmentSeriesCancellationStartDate: toDateString(subDays(new Date(), 5)),
          },
        ],
        visits: [],
        adjudications: [],
        externalTransfers: [],
        courtHearings: [],
        activities: [],
      } as PrisonerScheduledEvents

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(appointmentScheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.YES,
        user,
      )

      const appointments: ScheduledEvent[] = []

      unlockListItems.forEach(i => {
        i.events.forEach(item => {
          if (item.eventType === 'APPOINTMENT') {
            appointments.push(item)
          }
        })
      })

      expect(appointments).toHaveLength(1)
    })

    it('filter out cancelled events', async () => {
      const appointmentScheduledEvents = {
        prisonCode: 'MDI',
        startDate: '',
        endDate: '',
        appointments: [
          {
            appointmentId: 1,
            prisonerNumber: 'A1111AA',
            eventType: EventType.APPOINTMENT,
            cancelled: true,
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
          },
          {
            appointmentId: 2,
            prisonerNumber: 'A2222AA',
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
            eventType: EventType.APPOINTMENT,
            cancelled: false,
          },
        ],
        visits: [
          {
            appointmentId: 3,
            prisonerNumber: 'A1111AA',
            eventType: EventType.VISIT,
            cancelled: true,
          },
          {
            appointmentId: 4,
            prisonerNumber: 'A2222AA',
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
            eventType: EventType.VISIT,
            cancelled: false,
          },
        ],
        adjudications: [
          {
            appointmentId: 5,
            prisonerNumber: 'A1111AA',
            eventType: EventType.ADJUDICATION_HEARING,
            cancelled: true,
          },
          {
            appointmentId: 6,
            prisonerNumber: 'A2222AA',
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
            eventType: EventType.ADJUDICATION_HEARING,
            cancelled: false,
          },
        ],
        externalTransfers: [
          {
            appointmentId: 7,
            prisonerNumber: 'A1111AA',
            eventType: EventType.EXTERNAL_TRANSFER,
            cancelled: true,
          },
          {
            appointmentId: 8,
            prisonerNumber: 'A2222AA',
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
            eventType: EventType.EXTERNAL_TRANSFER,
            cancelled: false,
          },
        ],
        courtHearings: [
          {
            appointmentId: 9,
            prisonerNumber: 'A1111AA',
            eventType: EventType.COURT_HEARING,
            cancelled: true,
          },
          {
            appointmentId: 10,
            prisonerNumber: 'A2222AA',
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
            eventType: EventType.COURT_HEARING,
            cancelled: false,
          },
        ],
        activities: [
          {
            appointmentId: 11,
            prisonerNumber: 'A1111AA',
            eventType: EventType.ACTIVITY,
            startTime: '',
            summary: '',
            cancelled: true,
          },
          {
            appointmentId: 12,
            prisonerNumber: 'A2222AA',
            date: toDateString(subDays(new Date(), 2)),
            startTime: '',
            summary: '',
            eventType: EventType.ACTIVITY,
            cancelled: false,
          },
        ],
      } as PrisonerScheduledEvents

      when(prisonerSearchApiClient.searchPrisonersByLocationPrefix).mockResolvedValue(prisoners)
      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers).mockResolvedValue(appointmentScheduledEvents)

      const unlockListItems = await unlockListService.getFilteredUnlockList(
        new Date('2022-01-01'),
        'AM',
        'HB1',
        ['A-Wing', 'B-Wing', 'C-Wing'],
        'With',
        allActivityCategoriesFilter,
        'Both',
        [],
        null,
        YesNo.NO,
        user,
      )
      expect(unlockListItems).toEqual([
        {
          alerts: undefined,
          bookingId: '222222',
          category: undefined,
          cellLocation: '1-2-002',
          events: [
            {
              appointmentId: 2,
              cancelled: false,
              date: '2024-12-02',
              eventType: 'APPOINTMENT',
              prisonerNumber: 'A2222AA',
              startTime: '',
              summary: '',
            },
            {
              appointmentId: 10,
              cancelled: false,
              date: '2024-12-02',
              eventType: 'COURT_HEARING',
              prisonerNumber: 'A2222AA',
              startTime: '',
              summary: '',
            },
            {
              appointmentId: 4,
              cancelled: false,
              date: '2024-12-02',
              eventType: 'VISIT',
              prisonerNumber: 'A2222AA',
              startTime: '',
              summary: '',
            },
            {
              appointmentId: 6,
              cancelled: false,
              date: '2024-12-02',
              eventType: 'ADJUDICATION_HEARING',
              prisonerNumber: 'A2222AA',
              startTime: '',
              summary: '',
            },
            {
              appointmentId: 8,
              cancelled: false,
              date: '2024-12-02',
              eventType: 'EXTERNAL_TRANSFER',
              prisonerNumber: 'A2222AA',
              startTime: '',
              summary: '',
            },
          ],
          firstName: 'Two',
          incentiveLevel: undefined,
          isLeavingWing: true,
          lastName: 'Twoster',
          locationGroup: 'HB1',
          locationSubGroup: 'B-Wing',
          middleNames: undefined,
          prisonCode: 'MDI',
          prisonerNumber: 'A2222AA',
          status: 'IN',
        },
      ])
    })
  })
})
