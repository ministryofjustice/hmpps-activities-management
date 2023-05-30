import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import ActivitiesService from './activitiesService'
import { ServiceUser } from '../@types/express'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import {
  Activity,
  ActivityCategory,
  ActivityCreateRequest,
  ActivityLite,
  ActivityScheduleLite,
  LocationGroup,
  LocationPrefix,
  ScheduledActivity,
  PrisonPayBand,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentCategorySummary,
  ActivitySchedule,
  AppointmentDetails,
  AppointmentOccurrenceDetails,
  ActivityCandidate,
  AppointmentCreateRequest,
  BulkAppointment,
  EventReview,
  EventReviewSearchResults,
} from '../@types/activitiesAPI/types'
import activityLocations from './fixtures/activity_locations_am_1.json'
import activitySchedules from './fixtures/activity_schedules_1.json'
import activitySchedule1 from './fixtures/activity_schedule_1.json'
import appointment from './fixtures/appointment_1.json'
import appointmentDetails from './fixtures/appointment_details_1.json'
import appointmentOccurrenceDetails from './fixtures/appointment_occurrence_details_1.json'
import prisoners from './fixtures/prisoners_1.json'
import activityScheduleAllocation from './fixtures/activity_schedule_allocation_1.json'
import { AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentApplyTo } from '../@types/appointments'

jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')

describe('Activities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', firstName: 'John', lastName: 'Smith' } as ServiceUser

  const mockedLocationGroups = [{ name: 'Houseblock 1', key: 'Houseblock 1', children: [] }] as LocationGroup[]

  const mockedLocationPrefix = { locationPrefix: 'MDI-1-2' } as LocationPrefix

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

  describe('getActivitiesInCategory', () => {
    it('should get the list of activities from activities API', async () => {
      const expectedResult = [{ id: 1, summary: 'Maths level 1' }] as ActivityLite[]

      when(activitiesApiClient.getActivitiesInCategory).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivitiesInCategory(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivitiesInCategory).toHaveBeenCalledWith('MDI', 1, user)
    })
  })

  describe('getActivities', () => {
    it('should get the list of activities from activities API', async () => {
      const expectedResult = [{ id: 1, summary: 'Maths level 1' }] as ActivityLite[]

      when(activitiesApiClient.getActivities).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getActivities(user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getActivities).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('getSchedulesOfActivity', () => {
    it('should get the list of schedules from activities API', async () => {
      const expectedResult = [{ id: 1, description: 'Houseblock 1 AM' }] as ActivityScheduleLite[]

      when(activitiesApiClient.getSchedulesOfActivity).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getSchedulesOfActivity(1, user)

      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getSchedulesOfActivity).toHaveBeenCalledWith(1, user)
    })
  })

  describe('createActivity', () => {
    it('should call activities API client to create an activity', async () => {
      await activitiesService.createActivity({ prisonCode: 'MDI' } as ActivityCreateRequest, user)
      expect(activitiesApiClient.postActivityCreation).toHaveBeenCalledWith({ prisonCode: 'MDI' }, user)
    })
  })

  describe('allocateToSchedule', () => {
    it('should call activities API client to post an allocation', async () => {
      await activitiesService.allocateToSchedule(1, 'ABC123', 1, user)
      expect(activitiesApiClient.postAllocation).toHaveBeenCalledWith(1, 'ABC123', 1, user)
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
    it('should fetch internal prison locations that have activities scheduled using the activities API', async () => {
      when(activitiesApiClient.getScheduledPrisonLocations)
        .calledWith(atLeast('10001'))
        .mockResolvedValue(activityLocations)
      const locations = await activitiesService.getScheduledPrisonLocations('EDI', '10001', '2022-08-01', user)
      expect(locations.length).toEqual(41)
      expect(activitiesApiClient.getScheduledPrisonLocations).toHaveBeenCalledWith('EDI', '10001', '2022-08-01', user)
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

  describe('getDefaultScheduleOfActivity', () => {
    it('should fetch the default schedule from an activity', async () => {
      const activity = {
        schedules: [{ id: 110 }, { id: 111 }, { id: 112 }],
      } as unknown as Activity

      activitiesService.getDefaultScheduleOfActivity(activity, user)

      expect(activitiesApiClient.getActivitySchedule).toHaveBeenCalledWith(110, user)
    })
  })

  describe('getActivitySchedules', () => {
    it('should fetch activity schedules using the activities API', async () => {
      const criteria = { prisonerNumbers: ['G4793VF'] }
      when(prisonerSearchApiClient.searchByPrisonerNumbers)
        .calledWith(criteria, user)
        .mockResolvedValue(prisoners as Prisoner[])
      when(activitiesApiClient.getActivitySchedules)
        .calledWith(atLeast('10001'))
        .mockResolvedValueOnce(activitySchedules as unknown as ActivitySchedule[])

      when(activitiesApiClient.getActivitySchedules).calledWith(atLeast('10001')).mockResolvedValueOnce([])

      const results = await activitiesService.getActivitySchedules('MDI', '10001', '2022-08-01', 'AM', user)

      expect(results.length).toEqual(1)
      expect(activitiesApiClient.getActivitySchedules).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', user)
      expect(results[0]).toEqual(activityScheduleAllocation[1])
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

  describe('getLocationPrefix', () => {
    it('should fetch the location cell prefix for a group', async () => {
      when(activitiesApiClient.getPrisonLocationPrefixByGroup)
        .calledWith(atLeast(user))
        .mockResolvedValueOnce(mockedLocationPrefix)
      const results = await activitiesService.getLocationPrefix('Houseblock 1', user)
      expect(results).toEqual(mockedLocationPrefix)
      expect(activitiesApiClient.getPrisonLocationPrefixByGroup).toHaveBeenCalledWith('MDI', 'Houseblock 1', user)
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

  describe('getAppointment', () => {
    it('should return appointment from api when valid appointment id is used', async () => {
      when(activitiesApiClient.getAppointment)
        .calledWith(12345, user)
        .mockResolvedValue(appointment as Appointment)

      const actualResult = await activitiesService.getAppointment(12345, user)

      expect(actualResult).toEqual(appointment)
    })
  })

  describe('getAppointmentDetail', () => {
    it('should return appointment detail from api when valid appointment id is used', async () => {
      when(activitiesApiClient.getAppointmentDetails)
        .calledWith(12345, user)
        .mockResolvedValue(appointmentDetails as AppointmentDetails)

      const actualResult = await activitiesService.getAppointmentDetails(12345, user)

      expect(actualResult).toEqual(appointmentDetails)
    })
  })

  describe('getAppointmentOccurrenceDetail', () => {
    it('should return appointment occurrence detail from api when valid appointment id is used', async () => {
      when(activitiesApiClient.getAppointmentOccurrenceDetails)
        .calledWith(12, user)
        .mockResolvedValue(appointmentOccurrenceDetails as AppointmentOccurrenceDetails)

      const actualResult = await activitiesService.getAppointmentOccurrenceDetails(12, user)

      expect(actualResult).toEqual(appointmentOccurrenceDetails)
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

  describe('postCreateAppointment', () => {
    it('should return created appointment from api when valid request is sent', async () => {
      const request = {
        categoryCode: 'CHAP',
        prisonCode: 'SKI',
        internalLocationId: 123,
        inCell: false,
        startDate: '2023-02-07',
        startTime: '09:00',
        endTime: '10:30',
        comment: 'This appointment will help adjusting to life outside of prison',
        appointmentDescription: 'Appointment description',
        prisonerNumbers: ['A1234BC'],
        appointmentType: AppointmentType.INDIVIDUAL,
      } as AppointmentCreateRequest

      const expectedResponse = {
        id: 12345,
        appointmentType: 'INDIVIDUAL',
        prisonCode: 'SKI',
        categoryCode: 'CHAP',
        internalLocationId: 123,
        startDate: '2023-02-07',
        startTime: '09:00',
        endTime: '10:30',
        comment: 'This appointment will help adjusting to life outside of prison',
        appointmentDescription: 'Appointment description',
        created: '2023-02-07T15:37:59.266Z',
        createdBy: 'AAA01U',
        occurrences: [
          {
            id: 123456,
            internalLocationId: 123,
            startDate: '2023-02-07',
            startTime: '13:00',
            endTime: '13:30',
            comment: 'This appointment occurrence has been rescheduled due to staff availability',
            updated: '2023-02-07T15:37:59.266Z',
            updatedBy: 'AAA01U',
            allocations: [
              {
                id: 123456,
                prisonerNumber: 'A1234BC',
                bookingId: 456,
              },
            ],
          },
        ],
      } as Appointment

      when(activitiesApiClient.postCreateAppointment).calledWith(request, user).mockResolvedValue(expectedResponse)

      const response = await activitiesService.createAppointment(request, user)

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
      )
      expect(result).toEqual({ content: [{ name: 'Joe Bloggs' }] })
    })
  })

  describe('editAppointmentOccurrence', () => {
    it('should edit appointment occurrence', async () => {
      const apiRequest = {
        internalLocationId: 123,
        applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
      }

      await activitiesService.editAppointmentOccurrence(1, apiRequest, user)

      expect(activitiesApiClient.editAppointmentOccurrence).toHaveBeenCalledWith(1, apiRequest, user)
    })
  })

  describe('createBulkAppointment', () => {
    it('should call API to create and return bulk appointment', async () => {
      const request = {
        prisonCode: 'MDI',
        categoryCode: 'ACTI',
        internalLocationId: 27223,
        inCell: false,
        startDate: '2023-05-16',
        appointments: [
          { prisonerNumber: 'A1349DZ', startTime: '13:30', endTime: '14:30' },
          { prisonerNumber: 'A1350DZ', startTime: '15:00', endTime: '15:00' },
        ],
      }

      const expectedResponse = {
        bulkAppointmentId: 10,
        appointments: [
          {
            id: 37,
          },
          {
            id: 38,
          },
        ],
      } as BulkAppointment

      when(activitiesApiClient.postCreateBulkAppointment).calledWith(request, user).mockResolvedValue(expectedResponse)

      const response = await activitiesService.createBulkAppointment(request, user)

      expect(activitiesApiClient.postCreateBulkAppointment).toHaveBeenCalledWith(request, user)
      expect(response).toEqual(expectedResponse)
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
})
