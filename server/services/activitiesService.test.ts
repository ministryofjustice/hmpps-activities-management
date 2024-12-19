import { when } from 'jest-when'
import { addDays, subDays } from 'date-fns'
import atLeast from '../../jest.setup'
import ActivitiesApiClient from '../data/activitiesApiClient'
import ActivitiesService from './activitiesService'
import { ServiceUser } from '../@types/express'
import {
  Activity,
  ActivityCategory,
  ActivityCreateRequest,
  LocationGroup,
  ScheduledActivity,
  PrisonPayBand,
  PrisonerScheduledEvents,
  AppointmentSeries,
  AppointmentCategorySummary,
  ActivitySchedule,
  AppointmentSeriesDetails,
  AppointmentDetails,
  ActivityCandidate,
  AppointmentSeriesCreateRequest,
  AppointmentSet,
  EventReview,
  EventReviewSearchResults,
  DeallocationReason,
  PrisonerDeallocationRequest,
  EventAcknowledgeRequest,
  AllocationSuitability,
  PrisonerAllocations,
  AppointmentSetAppointment,
  AppointmentSetCreateRequest,
  AppointmentSetDetails,
  WaitingListApplicationRequest,
  WaitingListApplication,
  ActivitySummary,
  WaitingListApplicationUpdateRequest,
  AppointmentUpdateRequest,
  Allocation,
  AppointmentAttendanceRequest,
  AddCaseNoteRequest,
  AppointmentCancelRequest,
  MultipleAppointmentAttendanceRequest,
} from '../@types/activitiesAPI/types'
import activitySchedule1 from './fixtures/activity_schedule_1.json'
import appointmentSeriesDetails from './fixtures/appointment_series_details_1.json'
import appointmentDetails from './fixtures/appointment_details_1.json'
import multipleAppointmentDetails from './fixtures/appointment_details_multiple.json'
import { AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentApplyTo, AttendanceStatus } from '../@types/appointments'
import calcCurrentWeek from '../utils/helpers/currentWeekCalculator'
import { formatIsoDate } from '../utils/datePickerUtils'
import EventTier from '../enum/eventTiers'
import { PrisonerSuspensionStatus } from '../routes/activities/manage-allocations/journey'
import AttendanceAction from '../enum/attendanceAction'

jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

describe('Activities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient)

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  const mockedLocationGroups = [{ name: 'Houseblock 1', key: 'Houseblock 1', children: [] }] as LocationGroup[]

  describe('getActivity', () => {
    it('should get the activity from activities API', async () => {
      const expectedResult = { id: 1, description: 'Induction' } as Activity

      when(activitiesApiClient.getActivity).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivity(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivity).toHaveBeenCalledWith(1, user)
    })
  })

  describe('getActivityCategories', () => {
    it('should get the list of activity categories from activities API', async () => {
      const expectedResult = [{ id: 1, description: 'Induction' }] as ActivityCategory[]

      when(activitiesApiClient.getActivityCategories).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivityCategories(user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivityCategories).toHaveBeenCalledWith(user)
    })
  })

  describe('getActivities', () => {
    it('should get the list of activities from activities API', async () => {
      const expectedResult = [{ id: 1, activityName: 'Maths level 1' }] as ActivitySummary[]

      when(activitiesApiClient.getActivities).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivities(true, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivities).toHaveBeenCalledWith('MDI', true, user)
    })
  })

  describe('createActivity', () => {
    it('should call activities API client to create an activity', async () => {
      await activitiesService.createActivity({ prisonCode: 'MDI' } as ActivityCreateRequest, user)
      expect(activitiesApiClient.postActivityCreation).toHaveBeenCalledWith({ prisonCode: 'MDI' }, user)
    })
  })

  describe('suspendAllocations', () => {
    it('should call activities API client to suspend an allocation', async () => {
      await activitiesService.suspendAllocations(
        'ABC123',
        [1],
        '2023-01-01',
        PrisonerSuspensionStatus.SUSPENDED,
        { text: 'test case note', type: 'GEN' } as AddCaseNoteRequest,
        user,
      )
      expect(activitiesApiClient.suspendAllocations).toHaveBeenCalledWith(
        {
          prisonerNumber: 'ABC123',
          allocationIds: [1],
          suspendFrom: '2023-01-01',
          status: PrisonerSuspensionStatus.SUSPENDED,
          suspensionCaseNote: { text: 'test case note', type: 'GEN' },
        },
        user,
      )
    })
  })

  describe('unsuspendAllocations', () => {
    it('should call activities API client to unsuspend an allocation', async () => {
      await activitiesService.unsuspendAllocations('ABC123', [1], '2023-01-01', user)
      expect(activitiesApiClient.unsuspendAllocations).toHaveBeenCalledWith(
        {
          prisonerNumber: 'ABC123',
          allocationIds: [1],
          suspendUntil: '2023-01-01',
        },
        user,
      )
    })
  })

  describe('allocateToSchedule', () => {
    it('should call activities API client to post an allocation', async () => {
      await activitiesService.allocateToSchedule(1, 'ABC123', 1, user, '2023-01-01', null, [], 123)
      expect(activitiesApiClient.postAllocation).toHaveBeenCalledWith(1, 'ABC123', 1, user, '2023-01-01', null, [], 123)
    })
  })

  describe('getPayBandsForPrison', () => {
    it('should get the list of prison pay bands', async () => {
      const expectedResult = [{ id: 1, alias: 'High' }] as PrisonPayBand[]

      when(activitiesApiClient.getPayBandsForPrison).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getPayBandsForPrison(user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getPayBandsForPrison).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getScheduledActivitiesAtPrison', () => {
    it('should get the list activities scheduled at a prison between a date range', async () => {
      const expectedResult = [{ id: 1 }] as ScheduledActivity[]
      const date = new Date()

      when(activitiesApiClient.getScheduledActivitiesAtPrison).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getScheduledActivitiesAtPrison(date, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getScheduledActivitiesAtPrison).toHaveBeenCalledWith('MDI', date, date, user)
    })
  })

  describe('getCancelledScheduledActivitiesAtPrison', () => {
    it('should get the list of cancelled activities scheduled at a prison between a date range', async () => {
      const expectedResult = [{ id: 1 }] as ScheduledActivity[]
      const date = new Date()

      when(activitiesApiClient.getScheduledActivitiesAtPrison).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getCancelledScheduledActivitiesAtPrison(date, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getScheduledActivitiesAtPrison).toHaveBeenCalledWith(
        'MDI',
        date,
        date,
        user,
        undefined,
        true,
      )
    })
  })

  describe('getScheduledActivity', () => {
    it('should get the scheduled activitu by ID', async () => {
      const expectedResult = { id: 1 } as ScheduledActivity

      when(activitiesApiClient.getScheduledActivity).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getScheduledActivity(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getScheduledActivity).toHaveBeenCalledWith(1, user)
    })
  })

  describe('getScheduledEventsForPrisoners', () => {
    it('should fetch scheduled activities for a list of prisoners using the activities API', async () => {
      const expectedResult = { activities: [{ id: 1 }] } as unknown as PrisonerScheduledEvents

      when(activitiesApiClient.getScheduledEventsByPrisonerNumbers)
        .calledWith('MDI', expect.any(String), expect.arrayContaining(['ABC123', 'ABC321']), user)
        .mockResolvedValue(expectedResult)

      const scheduledEvents = await activitiesService.getScheduledEventsForPrisoners(
        new Date(),
        ['ABC123', 'ABC321'],
        user,
      )
      expect(scheduledEvents).toEqual(expectedResult)
    })
  })

  describe('getRolledOutPrisons', () => {
    it('should fetch rolled out prisons', async () => {
      const mockResponse = [
        { prisonCode: 'MDI', activitiesRolledOut: true, appointmentsRolledOut: true, maxDaysToExpiry: 21 },
        { prisonCode: 'LEI', activitiesRolledOut: true, appointmentsRolledOut: false, maxDaysToExpiry: 21 },
      ]
      activitiesApiClient.getRolledOutPrisons.mockResolvedValue(mockResponse)

      const result = await activitiesService.getRolledOutPrisons()

      expect(result).toEqual(mockResponse)
      expect(activitiesApiClient.getRolledOutPrisons).toHaveBeenCalled()
    })

    it('should handle an empty response', async () => {
      activitiesApiClient.getRolledOutPrisons.mockResolvedValue([])

      const result = await activitiesService.getRolledOutPrisons()

      expect(result).toEqual([])
      expect(activitiesApiClient.getRolledOutPrisons).toHaveBeenCalled()
    })
  })

  describe('getActivitySchedule', () => {
    it('should fetch activity schedule by id using the activities API', async () => {
      when(activitiesApiClient.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValueOnce(activitySchedule1 as unknown as ActivitySchedule)
      const result = await activitiesService.getActivitySchedule(1, user)
      expect(activitiesApiClient.getActivitySchedule).toHaveBeenCalledWith(1, user)
      expect(result).toEqual(activitySchedule1)
    })
  })

  describe('getLocationGroups', () => {
    it('should fetch the location groups for a prison using the activities API', async () => {
      when(activitiesApiClient.getPrisonLocationGroups)
        .calledWith(atLeast(user))
        .mockResolvedValueOnce(mockedLocationGroups)

      const results = await activitiesService.getLocationGroups(user)

      expect(results.length).toEqual(1)
      expect(results[0]).toEqual(mockedLocationGroups[0])
      expect(activitiesApiClient.getPrisonLocationGroups).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getAppointmentSeriesDetails', () => {
    it('should return appointment series detail from api when valid appointment series id is used', async () => {
      when(activitiesApiClient.getAppointmentSeriesDetails)
        .calledWith(12345, user)
        .mockResolvedValue(appointmentSeriesDetails as AppointmentSeriesDetails)

      const actualResult = await activitiesService.getAppointmentSeriesDetails(12345, user)

      expect(actualResult).toEqual(appointmentSeriesDetails)
    })
  })

  describe('getAppointmentDetails', () => {
    it('should return appointment detail from api when valid appointment id is used', async () => {
      when(activitiesApiClient.getAppointmentDetails)
        .calledWith(12, user)
        .mockResolvedValue(appointmentDetails as AppointmentDetails)

      const actualResult = await activitiesService.getAppointmentDetails(12, user)

      expect(actualResult).toEqual(appointmentDetails)
    })
  })

  describe('getAppointments', () => {
    it('should return multiple appointment details from api when valid appointment ids are used', async () => {
      when(activitiesApiClient.getAppointments)
        .calledWith([12, 13], user)
        .mockResolvedValue(multipleAppointmentDetails as AppointmentDetails[])

      const actualResult = await activitiesService.getAppointments([12, 13], user)

      expect(actualResult).toEqual(multipleAppointmentDetails)
    })
  })

  describe('getAppointmentCategories', () => {
    it('should return all categories from api', async () => {
      const expectedResult = [
        {
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        {
          code: 'MEDO',
          description: 'Medical - Doctor',
        },
        {
          code: 'GYMW',
          description: 'Gym - Weights',
        },
      ] as AppointmentCategorySummary[]

      when(activitiesApiClient.getAppointmentCategories).calledWith(user).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getAppointmentCategories(user)

      expect(actualResult).toEqual(expectedResult)
    })
  })

  describe('createAppointmentSeries', () => {
    it('should return created appointment series from api when valid request is sent', async () => {
      const request = {
        categoryCode: 'CHAP',
        prisonCode: 'SKI',
        internalLocationId: 123,
        inCell: false,
        startDate: '2023-02-07',
        startTime: '09:00',
        endTime: '10:30',
        extraInformation: 'This appointment will help adjusting to life outside of prison',
        customName: 'Appointment description',
        prisonerNumbers: ['A1234BC'],
        appointmentType: AppointmentType.GROUP,
      } as AppointmentSeriesCreateRequest

      const expectedResponse = {
        id: 12345,
        appointmentType: 'GROUP',
        prisonCode: 'SKI',
        categoryCode: 'CHAP',
        internalLocationId: 123,
        startDate: '2023-02-07',
        startTime: '09:00',
        endTime: '10:30',
        extraInformation: 'This appointment will help adjusting to life outside of prison',
        customName: 'Appointment description',
        createdTime: '2023-02-07T15:37:59.266Z',
        createdBy: 'AAA01U',
        appointments: [
          {
            id: 123456,
            prisonCode: 'SKI',
            categoryCode: 'CHAP',
            customName: 'Appointment description',
            internalLocationId: 123,
            startDate: '2023-02-07',
            startTime: '13:00',
            endTime: '13:30',
            extraInformation: 'This appointment has been rescheduled due to staff availability',
            createdTime: '2023-02-07T15:37:59.266Z',
            createdBy: 'AAA01U',
            updatedTime: '2023-02-07T15:37:59.266Z',
            updatedBy: 'AAA01U',
            attendees: [
              {
                id: 123456,
                prisonerNumber: 'A1234BC',
                bookingId: 456,
              },
            ],
          },
        ],
      } as AppointmentSeries

      when(activitiesApiClient.postCreateAppointmentSeries)
        .calledWith(request, user)
        .mockResolvedValue(expectedResponse)

      const response = await activitiesService.createAppointmentSeries(request, user)

      expect(response).toEqual(expectedResponse)
    })
  })

  describe('cancelScheduledActivity', () => {
    it('should cancel scheduled activity', async () => {
      const serviceRequest = {
        reason: 'Cancel reason',
        comment: 'Cancel comment',
      }

      const apiRequest = {
        reason: 'Cancel reason',
        comment: 'Cancel comment',
        username: user.username,
      }

      await activitiesService.cancelScheduledActivity(1, serviceRequest, user)

      expect(activitiesApiClient.putCancelScheduledActivity).toHaveBeenCalledWith(1, apiRequest, user)
    })
  })

  describe('uncancelScheduledActivity', () => {
    it('should uncancel scheduled activity', async () => {
      const apiRequest = {
        username: user.username,
        displayName: 'John Smith',
      }

      await activitiesService.uncancelScheduledActivity(1, user)

      expect(activitiesApiClient.putUncancelScheduledActivity).toHaveBeenCalledWith(1, apiRequest, user)
    })
  })

  describe('getActivityCandidates', () => {
    it('should return content of pageable candidates', async () => {
      when(activitiesApiClient.getActivityCandidates).mockResolvedValue({
        content: [{ name: 'Joe Bloggs' }] as ActivityCandidate[],
      })

      const result = await activitiesService.getActivityCandidates(1, user)

      expect(activitiesApiClient.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      )
      expect(result).toEqual({ content: [{ name: 'Joe Bloggs' }] })
    })
  })

  describe('editAppointment', () => {
    it('should edit appointment', async () => {
      const apiRequest = {
        internalLocationId: 123,
        applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
      } as AppointmentUpdateRequest

      await activitiesService.editAppointment(1, apiRequest, user)

      expect(activitiesApiClient.patchUpdateAppointment).toHaveBeenCalledWith(1, apiRequest, user)
    })
  })

  describe('cancelAppointment', () => {
    it('should cancel an appointment', async () => {
      const apiRequest: AppointmentCancelRequest = {
        applyTo: 'ALL_FUTURE_APPOINTMENTS',
        cancellationReasonId: 1,
      }

      await activitiesService.cancelAppointment(1, apiRequest, user)

      expect(activitiesApiClient.cancelAppointments).toHaveBeenCalledWith(1, apiRequest, user)
    })
  })

  describe('uncancelAppointment', () => {
    it('should uncancel an appointment', async () => {
      const apiRequest: AppointmentCancelRequest = {
        applyTo: 'ALL_FUTURE_APPOINTMENTS',
        cancellationReasonId: 1,
      }

      await activitiesService.uncancelAppointment(1, apiRequest, user)

      expect(activitiesApiClient.uncancelAppointments).toHaveBeenCalledWith(1, apiRequest, user)
    })
  })

  describe('createAppointmentSet', () => {
    it('should call API to create and return appointment set', async () => {
      const request = {
        prisonCode: 'MDI',
        categoryCode: 'ACTI',
        internalLocationId: 27223,
        inCell: false,
        startDate: '2023-05-16',
        appointments: [
          {
            prisonerNumber: 'A1349DZ',
            startTime: '13:30',
            endTime: '14:30',
            extraInformation: '',
          } as AppointmentSetAppointment,
          {
            prisonerNumber: 'A1350DZ',
            startTime: '15:00',
            endTime: '15:00',
            extraInformation: '',
          } as AppointmentSetAppointment,
        ],
      } as AppointmentSetCreateRequest

      const expectedResponse = {
        id: 10,
        appointments: [
          {
            id: 37,
          },
          {
            id: 38,
          },
        ],
      } as AppointmentSet

      when(activitiesApiClient.postCreateAppointmentSet).calledWith(request, user).mockResolvedValue(expectedResponse)

      const response = await activitiesService.createAppointmentSet(request, user)

      expect(activitiesApiClient.postCreateAppointmentSet).toHaveBeenCalledWith(request, user)
      expect(response).toEqual(expectedResponse)
    })
  })

  describe('getAppointmentSetDetails', () => {
    it('should return appointment set detail from api when valid appointment set id is used', async () => {
      const response = {
        id: 12345,
      } as AppointmentSetDetails

      when(activitiesApiClient.getAppointmentSetDetails).calledWith(12345, user).mockResolvedValue(response)

      const actualResult = await activitiesService.getAppointmentSetDetails(12345, user)

      expect(actualResult).toEqual(response)
    })
  })

  describe('getChangeEvents', () => {
    it('should get a list of change events from activities API', async () => {
      const content = [
        {
          eventReviewId: 1,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        } as EventReview,
        {
          eventReviewId: 2,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        } as EventReview,
        {
          eventReviewId: 3,
          serviceIdentifier: null,
          eventType: 'prison.xxx.yyy',
          eventTime: '2023-10-16 23:14:22',
          prisonCode: 'MDI',
          prisonerNumber: 'A1234AA',
          eventData: 'Some data',
        } as EventReview,
      ]

      const expectedResult = {
        content,
        pageNumber: 1,
        totalElements: 3,
        totalPages: 1,
      } as EventReviewSearchResults

      when(activitiesApiClient.getChangeEvents).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getChangeEvents('MDI', '2023-10-16', 1, 10, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getChangeEvents).toHaveBeenCalledWith('MDI', '2023-10-16', 1, 10, user)
    })
  })

  describe('acknowledgeChangeEvents', () => {
    it('should acknowledge a list of change event IDS', async () => {
      const eventReviewIds = [1, 2, 3]
      const request = { eventReviewIds } as EventAcknowledgeRequest

      await activitiesService.acknowledgeChangeEvents('MDI', eventReviewIds, user)

      expect(activitiesApiClient.acknowledgeChangeEvents).toHaveBeenCalledWith('MDI', request, user)
    })
  })

  describe('getDeallocationReasons', () => {
    it('should get the list of deallocation reasons from activities API', async () => {
      const expectedResult = [{ code: 'PERSONAL', description: 'Personal reason' }] as DeallocationReason[]

      when(activitiesApiClient.getDeallocationReasons).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getDeallocationReasons(user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getDeallocationReasons).toHaveBeenCalledWith(user)
    })
  })

  describe('deallocateFromActivity', () => {
    it('should deallocate prisoners', async () => {
      const body: PrisonerDeallocationRequest = {
        prisonerNumbers: ['123456'],
        reasonCode: 'PERSONAL',
        endDate: '2023-05-31',
        caseNote: { type: 'GEN', text: 'test case note' },
        scheduleInstanceId: 765,
      }

      await activitiesService.deallocateFromActivity(
        1,
        ['123456'],
        'PERSONAL',
        { type: 'GEN', text: 'test case note' },
        '2023-05-31',
        user,
        765,
      )
      expect(activitiesApiClient.deallocateFromActivity).toHaveBeenCalledWith(1, body, user)
    })
  })

  describe('getActivePrisonPrisonerAllocations', () => {
    it('should get prisoner allocations for the active prison', async () => {
      const expectedResult = [
        {
          prisonerNumber: 'G4793VF',
          allocations: [
            {
              id: 1,
              prisonerNumber: 'G4793VF',
              activitySummary: 'Maths level 1',
              scheduleDescription: 'Entry level Maths 1',
              startDate: '2022-10-10',
              endDate: null,
            },
          ],
        },
      ] as PrisonerAllocations[]

      when(activitiesApiClient.getPrisonerAllocations).mockResolvedValue(expectedResult)

      const result = await activitiesService.getActivePrisonPrisonerAllocations(['A1234BC'], user)
      expect(activitiesApiClient.getPrisonerAllocations).toHaveBeenCalledWith('MDI', ['A1234BC'], user)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('allocationSuitability', () => {
    it('should get prisoner allocation suitability', async () => {
      const expectedResult = {
        workplaceRiskAssessment: {
          suitable: true,
          riskLevel: 'none',
        },
        incentiveLevel: {
          suitable: true,
          incentiveLevel: 'Standard',
        },
        education: {
          suitable: true,
          education: [],
        },
        releaseDate: {
          suitable: false,
          earliestReleaseDate: null,
        },
      } as AllocationSuitability

      when(activitiesApiClient.allocationSuitability).mockResolvedValue(expectedResult)

      const result = await activitiesService.allocationSuitability(2, 'A1234BC', user)
      expect(activitiesApiClient.allocationSuitability).toHaveBeenCalledWith(2, 'A1234BC', user)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('logWaitlistApplication', () => {
    it('should call the api client to post the waitlist application', async () => {
      await activitiesService.logWaitlistApplication({ status: 'PENDING' } as WaitingListApplicationRequest, user)
      expect(activitiesApiClient.postWaitlistApplication).toHaveBeenCalledWith({ status: 'PENDING' }, user)
    })
  })

  describe('fetchActivityWaitlist', () => {
    it('should call the api client to fetch the waitlist applications for an activity', async () => {
      const response = [{ id: 12345 } as WaitingListApplication]

      when(activitiesApiClient.fetchActivityWaitlist).calledWith(1, user).mockResolvedValue(response)

      const actualResult = await activitiesService.fetchActivityWaitlist(1, user)

      expect(actualResult).toEqual(response)
    })
  })

  describe('patchWaitlistApplication', () => {
    it('should call the api client to patch the waitlist application', async () => {
      await activitiesService.patchWaitlistApplication(
        1,
        { status: 'PENDING' } as WaitingListApplicationUpdateRequest,
        user,
      )
      expect(activitiesApiClient.patchWaitlistApplication).toHaveBeenCalledWith(1, { status: 'PENDING' }, user)
    })
  })

  describe('fetchWaitlistApplication', () => {
    it('should call the api client to fetch a waitlist application by id', async () => {
      const response = { id: 12345 } as WaitingListApplication

      when(activitiesApiClient.fetchWaitlistApplication).calledWith(1, user).mockResolvedValue(response)

      const actualResult = await activitiesService.fetchWaitlistApplication(1, user)

      expect(actualResult).toEqual(response)
    })
  })

  describe('calcCurrentWeek', () => {
    const today = new Date()
    const tomorrow = addDays(today, 1)

    it("shouldn't calculate a current week for activities in the future", async () => {
      const currentWeek = calcCurrentWeek(tomorrow, 2)
      expect(currentWeek).toBeNull()
    })

    it.each([
      [today, 1],
      [subDays(today, 7), 2],
      [subDays(today, 14), 1],
      [subDays(today, 21), 2],
    ])(
      `should calculate current week correctly for multi-week schedule (start date: %s)`,
      async (startDate: Date, expectedCurrentWeek: number) => {
        const currentWeeks = calcCurrentWeek(startDate, 2)
        expect(currentWeeks).toEqual(expectedCurrentWeek)
      },
    )

    it.each([
      [today, 1],
      [subDays(today, 7), 1],
      [subDays(today, 14), 1],
      [subDays(today, 21), 1],
    ])(
      `should always calculate current week as 1 for single-week schedule (start date: %s)`,
      async (startDate: Date, expectedCurrentWeek: number) => {
        const currentWeeks = calcCurrentWeek(startDate, 1)
        expect(currentWeeks).toEqual(expectedCurrentWeek)
      },
    )
  })

  describe('getAllocations', () => {
    it('should call the api client and fetch allocations', async () => {
      const allocations = [
        {
          id: 9,
          prisonerNumber: 'ABC123',
        },
        {
          id: 10,
          prisonerNumber: 'ABC321',
        },
        {
          id: 11,
          prisonerNumber: 'ZXY123',
        },
      ] as Allocation[]

      when(activitiesApiClient.getAllocations)
        .calledWith(1, user)
        .mockResolvedValueOnce([
          {
            id: 9,
            prisonerNumber: 'ABC123',
          },
          {
            id: 10,
            prisonerNumber: 'ABC321',
          },
          {
            id: 11,
            prisonerNumber: 'ZXY123',
          },
        ] as Allocation[])

      const results = await activitiesService.getAllocations(1, user)

      expect(activitiesApiClient.getAllocations).toHaveBeenCalledWith(1, user)
      expect(results).toEqual(allocations)
    })
  })

  describe('getAllocationsWithParams', () => {
    it('should call the api client and fetch allocations', async () => {
      const allocations = [
        {
          id: 9,
          prisonerNumber: 'ABC123',
        },
        {
          id: 10,
          prisonerNumber: 'ABC321',
        },
        {
          id: 11,
          prisonerNumber: 'ZXY123',
        },
      ] as Allocation[]

      when(activitiesApiClient.getAllocationsWithParams)
        .calledWith(1, { date: '2023-01-01' }, user)
        .mockResolvedValueOnce(allocations)

      const results = await activitiesService.getAllocationsWithParams(1, { date: '2023-01-01' }, user)

      expect(activitiesApiClient.getAllocationsWithParams).toHaveBeenCalledWith(1, { date: '2023-01-01' }, user)
      expect(results).toEqual(allocations)
    })
  })

  describe('getAppointmentAttendanceSummaries', () => {
    it('should call the api client to get appointment attendance summaries', async () => {
      const prisonCode = 'MDI'
      const date = new Date()
      await activitiesService.getAppointmentAttendanceSummaries(prisonCode, date, user)
      expect(activitiesApiClient.getAppointmentAttendanceSummaries).toHaveBeenCalledWith(
        prisonCode,
        formatIsoDate(date),
        user,
        null,
        null,
      )
    })
  })

  describe('markAppointmentAttendance', () => {
    it('should call the api client to put the appointment attendance', async () => {
      const appointmentId = 1
      const request = {
        attendedPrisonNumbers: ['A1234BC'],
        nonAttendedPrisonNumbers: ['B2345CD'],
      } as AppointmentAttendanceRequest

      await activitiesService.markAppointmentAttendance(
        appointmentId,
        request.attendedPrisonNumbers,
        request.nonAttendedPrisonNumbers,
        user,
      )

      expect(activitiesApiClient.putAppointmentAttendance).toHaveBeenCalledWith(appointmentId, request, user)
    })
  })

  describe('updateMultipleAppointmentAttendances', () => {
    it('should call the api client to update multiple appointment attendances', async () => {
      const requests = [
        {
          appointmentId: 123,
          prisonerNumbers: ['B2345CD'],
        },
      ] as MultipleAppointmentAttendanceRequest[]

      await activitiesService.updateMultipleAppointmentAttendances(AttendanceAction.ATTENDED, requests, user)

      expect(activitiesApiClient.putAppointmentAttendances).toHaveBeenCalledWith(
        AttendanceAction.ATTENDED,
        requests,
        user,
      )
    })
  })

  describe('searchWaitingListApplications', () => {
    it('should call the api client and search for matching waiting list application', async () => {
      const request = {
        prisonerNumbers: ['A1234BC'],
      }
      const pageSearch = {
        page: 1,
        pageSize: 20,
      }

      await activitiesService.searchWaitingListApplications('MDI', request, pageSearch, user)

      expect(activitiesApiClient.searchWaitingListApplications).toHaveBeenCalledWith('MDI', request, pageSearch, user)
    })
  })

  describe('Check rolled out Prisons', () => {
    it('should return all agencies when one of either appointments or activities is rolled out', async () => {
      const mockResponse = [
        { prisonCode: 'MDI', activitiesRolledOut: false, appointmentsRolledOut: true, maxDaysToExpiry: 21 },
        { prisonCode: 'LEI', activitiesRolledOut: true, appointmentsRolledOut: false, maxDaysToExpiry: 21 },
      ]
      activitiesApiClient.getRolledOutPrisons.mockResolvedValue(mockResponse)

      const activeAgencies = await activitiesService.activeRolledPrisons()

      expect(activeAgencies).toEqual(['MDI', 'LEI'])
    })

    it('should return an empty array if no activities or appointments have been rolled out.', async () => {
      const mockResponse = [
        { prisonCode: 'MDI', activitiesRolledOut: false, appointmentsRolledOut: false, maxDaysToExpiry: 21 },
        { prisonCode: 'LEI', activitiesRolledOut: false, appointmentsRolledOut: false, maxDaysToExpiry: 21 },
      ]
      activitiesApiClient.getRolledOutPrisons.mockResolvedValue(mockResponse)

      const activeAgencies = await activitiesService.activeRolledPrisons()

      expect(activeAgencies).toEqual([])
    })

    it('should return all agencies when both activities and appointments are rolled out', async () => {
      const mockResponse = [
        { prisonCode: 'MDI', activitiesRolledOut: true, appointmentsRolledOut: true, maxDaysToExpiry: 21 },
        { prisonCode: 'LPI', activitiesRolledOut: true, appointmentsRolledOut: true, maxDaysToExpiry: 21 },
      ]
      activitiesApiClient.getRolledOutPrisons.mockResolvedValue(mockResponse)

      const activeAgencies = await activitiesService.activeRolledPrisons()

      expect(activeAgencies).toEqual(['MDI', 'LPI'])
    })
  })

  describe('getAppointmentsByStatusAndDate', () => {
    it('should call the api client to get the basic appointments', async () => {
      const prisonCode = 'MDI'
      const date = new Date()
      const status = AttendanceStatus.ATTENDED
      await activitiesService.getAppointmentsByStatusAndDate(prisonCode, status, date, user)
      expect(activitiesApiClient.AppointmentAttendeeByStatus).toHaveBeenCalledWith(
        prisonCode,
        status,
        formatIsoDate(date),
        user,
        null,
        null,
        null,
        null,
        null,
      )
    })
    it('should call the api client to get the appointments with filters', async () => {
      const prisonCode = 'MDI'
      const date = new Date()
      const status = AttendanceStatus.NOT_ATTENDED
      const categoryCode = 'OIC'
      const customName = 'Adjudication Hearing'
      const prisonerNumber = 'G6123VU'
      const eventTier = EventTier.TIER_1
      await activitiesService.getAppointmentsByStatusAndDate(
        prisonCode,
        status,
        date,
        user,
        categoryCode,
        customName,
        prisonerNumber,
        eventTier,
      )
      expect(activitiesApiClient.AppointmentAttendeeByStatus).toHaveBeenCalledWith(
        prisonCode,
        status,
        formatIsoDate(date),
        user,
        categoryCode,
        customName,
        prisonerNumber,
        eventTier,
        null,
      )
    })
  })
})
