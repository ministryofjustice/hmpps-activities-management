import { when } from 'jest-when'
import atLeast from '../../jest.setup'
import ActivitiesApiClient from '../data/activitiesApiClient'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import ActivitiesService from './activitiesService'
import { ServiceUser } from '../@types/express'
import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import {
  Activity,
  ActivityCategory,
  ActivityCreateRequest,
  ActivityScheduleCreateRequest,
  ActivityLite,
  ActivityScheduleLite,
  LocationGroup,
  RolloutPrison,
  ScheduledActivity,
  PrisonPayBand,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentCategory,
} from '../@types/activitiesAPI/types'
import { PrisonApiUserDetail } from '../@types/prisonApiImport/types'
import { LocationLenient } from '../@types/prisonApiImportCustom'
import activityLocations from './fixtures/activity_locations_am_1.json'
import activitySchedules from './fixtures/activity_schedules_1.json'
import activitySchedule1 from './fixtures/activity_schedule_1.json'
import appointment from './fixtures/appointment_1.json'
import prisoners from './fixtures/prisoners_1.json'
import activityScheduleAllocation from './fixtures/activity_schedule_allocation_1.json'

jest.mock('../data/activitiesApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/prisonApiClient')

describe('Activities Service', () => {
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient, prisonApiClient)

  const user = { activeCaseLoadId: 'MDI' } as ServiceUser

  const mockedLocationGroups = [
    {
      name: 'Houseblock 1',
      key: 'Houseblock 1',
      children: [],
    },
  ] as LocationGroup[]

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

  describe('createScheduleActivity', () => {
    it('should call activities API client to create an activity schedule', async () => {
      await activitiesService.createScheduleActivity(
        1,
        { description: 'Activity schedule', startDate: '2022-08-01' } as ActivityScheduleCreateRequest,
        user,
      )
      expect(activitiesApiClient.postActivityScheduleCreation).toHaveBeenCalledWith(
        1,
        { description: 'Activity schedule', startDate: '2022-08-01' },
        user,
      )
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

  describe('getPrison', () => {
    it('should get rollout prison information from activities API', async () => {
      const expectedResult = { id: 1, code: 'MDI', description: 'Moorlands', active: true } as RolloutPrison
      when(activitiesApiClient.getRolloutPrison).calledWith(atLeast('MDI')).mockResolvedValue(expectedResult)
      const actualResult = await activitiesService.getPrison('MDI', user)
      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getRolloutPrison).toHaveBeenCalledWith('MDI', user)
    })
  })

  describe('populateUserPrisonInfo', () => {
    it('should add the prisons rollout status to the users caseload info API', async () => {
      const rolloutPrisonResult = { id: 1, code: 'MDI', description: 'Moorlands', active: true } as RolloutPrison
      when(activitiesApiClient.getRolloutPrison).calledWith(atLeast('MDI')).mockResolvedValue(rolloutPrisonResult)

      const testUser = {
        allCaseLoads: [
          {
            caseLoadId: 'MDI',
            caseloadFunction: 'ADMIN',
            currentlyActive: true,
            description: 'Moorlands',
            type: 'APP',
          },
        ],
      } as ServiceUser

      const actualResult = await activitiesService.populateUserPrisonInfo(testUser)

      const expectedResult = {
        allCaseLoads: [
          {
            caseLoadId: 'MDI',
            caseloadFunction: 'ADMIN',
            currentlyActive: true,
            description: 'Moorlands',
            type: 'APP',
            isRolledOut: true,
          },
        ],
      } as ServiceUser
      expect(actualResult).toEqual(expectedResult)
      expect(activitiesApiClient.getRolloutPrison).toHaveBeenCalledWith('MDI', testUser)
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

  describe('getActivitySchedules', () => {
    it('should fetch activity schedules using the activities API', async () => {
      const criteria = { prisonerNumbers: ['G4793VF'] }
      when(prisonerSearchApiClient.searchByPrisonerNumbers)
        .calledWith(criteria, user)
        .mockResolvedValue(prisoners as Prisoner[])
      when(activitiesApiClient.getActivitySchedules)
        .calledWith(atLeast('10001'))
        .mockResolvedValueOnce(activitySchedules)

      when(activitiesApiClient.getActivitySchedules).calledWith(atLeast('10001')).mockResolvedValueOnce([])

      const results = await activitiesService.getActivitySchedules('MDI', '10001', '2022-08-01', 'AM', user)

      expect(results.length).toEqual(1)
      expect(activitiesApiClient.getActivitySchedules).toHaveBeenCalledWith('MDI', '10001', '2022-08-01', 'AM', user)
      expect(results[0]).toEqual(activityScheduleAllocation[1])
    })
  })

  describe('getActivitySchedule', () => {
    it('should fetch activity schedule by id using the activities API', async () => {
      when(activitiesApiClient.getActivitySchedule).calledWith(atLeast(1)).mockResolvedValueOnce(activitySchedule1)
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

  describe('getAppointment', () => {
    it('should return appointment from api when valid appointment id is used', async () => {
      when(activitiesApiClient.getAppointment).calledWith(12345, user).mockResolvedValue(appointment)

      const actualResult = await activitiesService.getAppointment(12345, user)

      expect(actualResult).toEqual(appointment)
    })
  })

  describe('getAppointmentDetails', () => {
    it('should return appointment details from api when valid appointment id is used', async () => {
      when(activitiesApiClient.getAppointment).calledWith(12345, user).mockResolvedValue(appointment)

      const getLocationsForEventTypeResponse = [{ locationId: appointment.internalLocationId }] as LocationLenient[]
      when(prisonApiClient.getLocationsForEventType)
        .calledWith('SKI', 'APP', user)
        .mockResolvedValue(getLocationsForEventTypeResponse)

      const appointmentPrisonerNo = appointment.occurrences[0].allocations[0].prisonerNumber
      const criteria = { prisonerNumbers: [appointmentPrisonerNo] }

      when(prisonerSearchApiClient.searchByPrisonerNumbers)
        .calledWith(criteria, user)
        .mockResolvedValue(prisoners as Prisoner[])

      const appointmentUser = { firstName: 'Lee', lastName: 'Jacobson', staffId: 1000 }
      when(prisonApiClient.getUserByUsername)
        .calledWith(appointment.createdBy, user)
        .mockResolvedValue(appointmentUser as PrisonApiUserDetail)

      when(prisonApiClient.getUserByUsername)
        .calledWith(appointment.updatedBy, user)
        .mockResolvedValue(appointmentUser as PrisonApiUserDetail)

      const actualAppointmentResult = await activitiesService.getAppointmentDetails(12345, user)

      expect(actualAppointmentResult.id).toEqual(12345)
      expect(actualAppointmentResult.occurrences.length).toEqual(1)
      expect(actualAppointmentResult.internalLocation.locationId).toEqual(26963)
      expect(actualAppointmentResult.occurrences[0].internalLocation.locationId).toEqual(26963)
      expect(actualAppointmentResult.prisoners.length).toEqual(1)
      expect(actualAppointmentResult.prisoners[0].prisonerNumber).toEqual('G4793VF')
      expect(actualAppointmentResult.prisoners[0].prisonerNumber).toEqual('G4793VF')
      expect(actualAppointmentResult.createdBy).toEqual('Lee Jacobson')
      expect(actualAppointmentResult.updatedBy).toEqual('Lee Jacobson')
    })
  })

  describe('getAppointmentDetails', () => {
    when(activitiesApiClient.getAppointment).calledWith(12345, user).mockResolvedValue(appointment)

    const getLocationsForEventTypeResponse = [{ locationId: appointment.internalLocationId }] as LocationLenient[]
    when(prisonApiClient.getLocationsForEventType)
      .calledWith('SKI', 'APP', user)
      .mockResolvedValue(getLocationsForEventTypeResponse)

    const appointmentPrisonerNo = appointment.occurrences[0].allocations[0].prisonerNumber
    const criteria = { prisonerNumbers: [appointmentPrisonerNo] }

    when(prisonerSearchApiClient.searchByPrisonerNumbers)
      .calledWith(criteria, user)
      .mockResolvedValue(prisoners as Prisoner[])

    const appointmentUser = { firstName: 'Lee', lastName: 'Jacobson', staffId: 1000 }
    when(prisonApiClient.getUserByUsername)
      .calledWith(appointment.createdBy, user)
      .mockResolvedValue(appointmentUser as PrisonApiUserDetail)
      .defaultRejectedValue({
        status: 404,
      })

    when(prisonApiClient.getUserByUsername)
      .calledWith(appointment.updatedBy, user)
      .mockResolvedValue(appointmentUser as PrisonApiUserDetail)

    it('should return appointment details from api when valid appointment id is used', async () => {
      const actualAppointmentResult = await activitiesService.getAppointmentDetails(12345, user)

      expect(actualAppointmentResult.id).toEqual(12345)
      expect(actualAppointmentResult.occurrences.length).toEqual(1)
      expect(actualAppointmentResult.internalLocation.locationId).toEqual(26963)
      expect(actualAppointmentResult.occurrences[0].internalLocation.locationId).toEqual(26963)
      expect(actualAppointmentResult.prisoners.length).toEqual(1)
      expect(actualAppointmentResult.prisoners[0].prisonerNumber).toEqual('G4793VF')
      expect(actualAppointmentResult.prisoners[0].prisonerNumber).toEqual('G4793VF')
      expect(actualAppointmentResult.createdBy).toEqual('Lee Jacobson')
      expect(actualAppointmentResult.updatedBy).toEqual('Lee Jacobson')
    })

    it("should return appointment details when created by username isn't found", async () => {
      const unknownUserAppointment = {
        ...appointment,
        createdBy: 'AN_UNKNOWN_USERNAME',
      }
      when(activitiesApiClient.getAppointment).calledWith(12345, user).mockResolvedValue(unknownUserAppointment)

      const actualAppointmentResult = await activitiesService.getAppointmentDetails(12345, user)

      expect(actualAppointmentResult.id).toEqual(12345)
      expect(actualAppointmentResult.occurrences.length).toEqual(1)
      expect(actualAppointmentResult.internalLocation.locationId).toEqual(26963)
      expect(actualAppointmentResult.occurrences[0].internalLocation.locationId).toEqual(26963)
      expect(actualAppointmentResult.prisoners.length).toEqual(1)
      expect(actualAppointmentResult.prisoners[0].prisonerNumber).toEqual('G4793VF')
      expect(actualAppointmentResult.prisoners[0].prisonerNumber).toEqual('G4793VF')
      expect(actualAppointmentResult.createdBy).toEqual(null)
      expect(actualAppointmentResult.updatedBy).toEqual('Lee Jacobson')
    })
  })

  describe('getAppointmentCategories', () => {
    it('should return all categories from api', async () => {
      const expectedResult = [
        {
          id: 51,
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        {
          id: 11,
          code: 'MEDO',
          description: 'Medical - Doctor',
        },
        {
          id: 20,
          code: 'GYMW',
          description: 'Gym - Weights',
        },
      ] as AppointmentCategory[]

      when(activitiesApiClient.getAppointmentCategories).calledWith(user).mockResolvedValue(expectedResult)

      const actualResult = await activitiesService.getAppointmentCategories(user)

      expect(actualResult).toEqual(expectedResult)
    })
  })

  describe('postCreateAppointment', () => {
    it('should return created appointment from api when valid request is sent', async () => {
      const request = {
        categoryId: 51,
        prisonCode: 'SKI',
        internalLocationId: 123,
        inCell: false,
        startDate: '2023-02-07',
        startTime: '09:00',
        endTime: '10:30',
        comment: 'This appointment will help adjusting to life outside of prison',
        prisonerNumbers: ['A1234BC'],
      }

      const expectedResponse = {
        id: 12345,
        category: {
          id: 51,
          code: 'CHAP',
          description: 'Chaplaincy',
        },
        prisonCode: 'SKI',
        internalLocationId: 123,
        startDate: '2023-02-07',
        startTime: '09:00',
        endTime: '10:30',
        comment: 'This appointment will help adjusting to life outside of prison',
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
            cancelled: false,
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
})
