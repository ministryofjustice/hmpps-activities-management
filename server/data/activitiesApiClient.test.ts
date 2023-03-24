import nock from 'nock'

import { parse } from 'date-fns'
import config from '../config'
import ActivitiesApiClient from './activitiesApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import {
  ActivityCreateRequest,
  ActivityScheduleCreateRequest,
  Allocation,
  LocationGroup,
  LocationPrefix,
  PrisonerAllocations,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentDetails,
  AppointmentOccurrenceDetails,
  AppointmentCategorySummary,
} from '../@types/activitiesAPI/types'
import TimeSlot from '../enum/timeSlot'

const user = { token: 'token' } as ServiceUser

jest.mock('./tokenStore')

describe('activitiesApiClient', () => {
  let fakeActivitiesApi: nock.Scope
  let activitiesApiClient: ActivitiesApiClient

  beforeEach(() => {
    fakeActivitiesApi = nock(config.apis.activitiesApi.url)
    activitiesApiClient = new ActivitiesApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getActivity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activities/1').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivityCategories', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activity-categories').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivityCategories(user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getCategoryCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/prison/MDI/activity-categories/1/capacity')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getCategoryCapacity('MDI', 1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitiesInCategory', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/prison/MDI/activity-categories/1/activities')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getActivitiesInCategory('MDI', 1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivities', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/prison/MDI/activities').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivities('MDI', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivityCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activities/1/capacity').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivityCapacity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getSchedulesOfActivity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/activities/1/schedules').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getSchedulesOfActivity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitySchedule', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/schedules/1').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getActivitySchedule(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getScheduleCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/schedules/1/capacity').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getScheduleCapacity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getScheduledActivitiesAtPrison', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/prisons/MDI/scheduled-instances')
        .query({ startDate: '2022-08-01', endDate: '2022-08-01', slot: 'am' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getScheduledActivitiesAtPrison(
        'MDI',
        parse('2022-08-01', 'yyyy-MM-dd', new Date()),
        parse('2022-08-01', 'yyyy-MM-dd', new Date()),
        user,
        TimeSlot.AM,
      )

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getScheduledActivity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/scheduled-instances/1').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await activitiesApiClient.getScheduledActivity(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postActivityCreation', () => {
    it('should post data to api', async () => {
      fakeActivitiesApi
        .post('/activities', {
          prisonCode: 'MDI',
          summary: 'Maths level 1',
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(200)

      await activitiesApiClient.postActivityCreation(
        { prisonCode: 'MDI', summary: 'Maths level 1' } as ActivityCreateRequest,
        user,
      )

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postActivityScheduleCreation', () => {
    it('should post data to api', async () => {
      fakeActivitiesApi
        .post('/activities/1/schedules', {
          description: 'Activity schedule',
          startDate: '2023-08-01',
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(200)

      await activitiesApiClient.postActivityScheduleCreation(
        1,
        { description: 'Activity schedule', startDate: '2023-08-01' } as ActivityScheduleCreateRequest,
        user,
      )

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postAllocation', () => {
    it('should post data to api', async () => {
      fakeActivitiesApi
        .post('/schedules/1/allocations', {
          prisonerNumber: 'ABC123',
          payBandId: 1,
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(204)

      await activitiesApiClient.postAllocation(1, 'ABC123', 1, user)

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPayBandsForPrison', () => {
    it('should return data from api', async () => {
      fakeActivitiesApi.get('/prison/MDI/prison-pay-bands').matchHeader('authorization', `Bearer token`).reply(204)

      await activitiesApiClient.getPayBandsForPrison('MDI', user)

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchActivityLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/prison/MDI/locations')
        .query({ date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getScheduledPrisonLocations('MDI', '2022-08-01', 'AM', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitiesAtLocation', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/prison/MDI/schedules')
        .query({ locationId: 'LOC', date: '2022-08-01', timeSlot: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getActivitySchedules('MDI', 'LOC', '2022-08-01', 'AM', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getRolloutPrison', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/rollout/MDI').matchHeader('authorization', `Bearer token`).reply(200, response)
      const output = await activitiesApiClient.getRolloutPrison('MDI', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAttendances', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/scheduled-instances/123/attendances')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAttendances(123, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPrisonLocationGroups', () => {
    it('should return data from api', async () => {
      const response = [
        {
          name: 'Houseblock 1',
          key: 'Houseblock 1',
          children: [],
        },
      ] as LocationGroup[]

      fakeActivitiesApi
        .get('/locations/prison/MDI/location-groups')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonLocationGroups('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPrisonLocationPrefixByGroup', () => {
    it('should return data from api', async () => {
      const response = { locationPrefix: 'MDI-1-' } as LocationPrefix

      fakeActivitiesApi
        .get('/locations/prison/MDI/location-prefix')
        .query({ groupName: 'Houseblock 1' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonLocationPrefixByGroup('MDI', 'Houseblock 1', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAllocations', () => {
    it('should return data from api', async () => {
      const response = [
        {
          id: 1,
          prisonerNumber: '1234567',
        },
      ] as Allocation[]

      fakeActivitiesApi
        .get('/schedules/1/allocations')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAllocations(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPrisonerAllocations', () => {
    it('should return data from api', async () => {
      const response = [
        {
          prisonerNumber: '1234567',
          allocations: [
            {
              id: 1,
              prisonerNumber: '1234567',
            },
          ],
        },
      ] as PrisonerAllocations[]

      fakeActivitiesApi
        .post('/prisons/MDI/prisoner-allocations')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getPrisonerAllocations('MDI', ['1234567'], user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('GET getScheduledEvents', () => {
    const prisonCode = 'MDI'
    const prisonerNumber = 'A1234AA'
    const startDate = '2022-10-01'
    const endDate = '2022-10-02'

    it('should return scheduled events for an individual prisoner and a date range', async () => {
      const response = {
        prisonCode,
        prisonerNumbers: [prisonerNumber],
        startDate,
        endDate,
        appointments: [],
        activities: [],
        visits: [],
        courtHearings: [],
      } as PrisonerScheduledEvents

      fakeActivitiesApi
        .get(`/scheduled-events/prison/${prisonCode}`)
        .query({ prisonerNumber, startDate, endDate })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const result = await activitiesApiClient.getScheduledEvents(prisonCode, prisonerNumber, startDate, endDate, user)

      expect(result).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('POST getScheduledEventsByPrisonerNumbers', () => {
    const prisonCode = 'MDI'
    const prisonerNumbers = ['A1234AA', 'B1234BB']
    const date = '2022-10-01'
    const timeSlot = 'AM'

    it('should return scheduled events for a list of prisoners and single date / time slot', async () => {
      const response = {
        prisonCode,
        prisonerNumbers,
        startDate: date,
        endDate: date,
        appointments: [],
        activities: [],
        visits: [],
        courtHearings: [],
      } as PrisonerScheduledEvents

      fakeActivitiesApi
        .post(`/scheduled-events/prison/${prisonCode}`, prisonerNumbers)
        .query({ date, timeSlot })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const result = await activitiesApiClient.getScheduledEventsByPrisonerNumbers(
        prisonCode,
        date,
        prisonerNumbers,
        user,
        timeSlot,
      )

      expect(result).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointment', () => {
    it('should return appointment from api when valid appointment id is used', async () => {
      const response = {
        id: 12345,
        categoryCode: 'CHAP',
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

      fakeActivitiesApi.get('/appointments/12345').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await activitiesApiClient.getAppointment(12345, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointmentDetails', () => {
    it('should return appointment details from api when valid appointment id is used', async () => {
      const response = {
        id: 12345,
      } as AppointmentDetails

      fakeActivitiesApi
        .get('/appointment-details/12345')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentDetails(12345, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointmentOccurrenceDetails', () => {
    it('should return appointment occurrence details from api when valid appointment occurrence id is used', async () => {
      const response = {
        id: 123456,
      } as AppointmentOccurrenceDetails

      fakeActivitiesApi
        .get('/appointment-occurrence-details/123456')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentOccurrenceDetails(123456, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointmentCategories', () => {
    it('should return all categories from api', async () => {
      const response = [
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

      fakeActivitiesApi.get('/appointment-categories').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await activitiesApiClient.getAppointmentCategories(user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
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
        prisonerNumbers: ['A1234BC'],
      }

      const response = {
        id: 12345,
        categoryCode: 'CHAP',
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

      fakeActivitiesApi.post('/appointments', request).matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await activitiesApiClient.postCreateAppointment(request, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('putCancelScheduledActivity', () => {
    it('should cancel scheduled activity', async () => {
      fakeActivitiesApi.put('/scheduled-instances/1/cancel').matchHeader('authorization', `Bearer token`).reply(200)

      const body = {
        reason: 'Cancellation reason',
        username: 'USER1',
      }

      await activitiesApiClient.putCancelScheduledActivity(1, body, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('putUncancelScheduledActivity', () => {
    it('should uncancel scheduled activity', async () => {
      fakeActivitiesApi.put('/scheduled-instances/1/uncancel').matchHeader('authorization', `Bearer token`).reply(200)

      const body = {
        username: 'USER1',
        displayName: 'John Smith',
      }

      await activitiesApiClient.putUncancelScheduledActivity(1, body, user)
      expect(nock.isDone()).toBe(true)
    })
  })
})
