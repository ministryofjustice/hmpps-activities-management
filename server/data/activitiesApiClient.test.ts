import nock from 'nock'

import { parse } from 'date-fns'
import config from '../config'
import ActivitiesApiClient from './activitiesApiClient'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import {
  ActivityCreateRequest,
  Allocation,
  LocationGroup,
  LocationPrefix,
  PrisonerAllocations,
  PrisonerScheduledEvents,
  Appointment,
  AppointmentDetails,
  AppointmentOccurrenceDetails,
  AppointmentCategorySummary,
  AppointmentLocationSummary,
  AppointmentCreateRequest,
  PrisonerDeallocationRequest,
  EventAcknowledgeRequest,
  EventReview,
  EventReviewSearchResults,
} from '../@types/activitiesAPI/types'
import TimeSlot from '../enum/timeSlot'
import { AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentApplyTo } from '../@types/appointments'

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
      fakeActivitiesApi
        .get('/prison/MDI/activities?excludeArchived=true')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getActivities('MDI', true, user)
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

  describe('postAllocation', () => {
    it('should post data to api', async () => {
      fakeActivitiesApi
        .post('/schedules/1/allocations', {
          prisonerNumber: 'ABC123',
          payBandId: 1,
          startDate: '2023-01-01',
          endDate: null,
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(204)

      await activitiesApiClient.postAllocation(1, 'ABC123', 1, user, '2023-01-01', null)

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

  describe('getRolloutPrisonPlan', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/rollout/MDI').matchHeader('authorization', `Bearer accessToken`).reply(200, response)
      const output = await activitiesApiClient.getPrisonRolloutPlan('MDI')
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    it('should return default data when 404 encountered', async () => {
      const response = { activitiesRolledOut: false, appointmentsRolledOut: false, prisonCode: 'MDI' }
      fakeActivitiesApi.get('/rollout/MDI').matchHeader('authorization', `Bearer accessToken`).reply(404, response)
      const output = await activitiesApiClient.getPrisonRolloutPlan('MDI')
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
        .get('/schedules/1/allocations?activeOnly=true')
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
        appointmentType: 'INDIVIDUAL',
        prisonCode: 'SKI',
        categoryCode: 'CHAP',
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
            sequenceNumber: 1,
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

  describe('getAppointmentLocations', () => {
    it('should return all locations from api', async () => {
      const response = [
        {
          id: 1,
          prisonCode: 'MDI',
          description: 'Appointment Location 1',
        },
        {
          id: 2,
          prisonCode: 'MDI',
          description: 'Appointment Location 2',
        },
        {
          id: 3,
          prisonCode: 'MDI',
          description: 'Appointment Location 3',
        },
      ] as AppointmentLocationSummary[]

      fakeActivitiesApi
        .get('/appointment-locations/MDI')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentLocations('MDI', user)
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
        appointmentDescription: 'Appointment description',
        prisonerNumbers: ['A1234BC'],
        appointmentType: AppointmentType.INDIVIDUAL,
      } as AppointmentCreateRequest

      const response = {
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

  describe('patchAppointmentOccurrence', () => {
    it('should update an appointment occurrence', async () => {
      fakeActivitiesApi.patch('/appointment-occurrences/1').matchHeader('authorization', `Bearer token`).reply(200)

      const body = {
        startDate: '2023-02-07',
        startTime: '13:00',
        endTime: '13:30',
        applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
      }

      await activitiesApiClient.editAppointmentOccurrence(1, body, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivityCandidates', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/schedules/1/candidates')
        .query({
          suitableIncentiveLevel: 'Basic',
          suitableRiskLevel: 'RHI',
          suitableForEmployed: true,
          search: 'test',
          page: 2,
          size: 5,
        })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.getActivityCandidates(1, user, ['Basic'], ['RHI'], true, 'test', 2)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postCreateBulkAppointment', () => {
    it('should successfully post data to api', async () => {
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

      const response = {
        bulkAppointmentId: 10,
        appointments: [
          {
            id: 37,
          },
          {
            id: 38,
          },
        ],
      }

      fakeActivitiesApi
        .post('/bulk-appointments', request)
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await activitiesApiClient.postCreateBulkAppointment(request, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getDeallocationReasons', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/allocations/deallocation-reasons')
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getDeallocationReasons(user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('putDeallocateFromActivity', () => {
    it('should deallocation prisoners', async () => {
      fakeActivitiesApi.put('/schedules/1/deallocate').matchHeader('authorization', `Bearer token`).reply(204)

      const body: PrisonerDeallocationRequest = {
        prisonerNumbers: ['123456'],
        reasonCode: 'PERSONAL',
        endDate: '2023-05-31',
      }

      await activitiesApiClient.deallocateFromActivity(1, body, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getChangeEvents', () => {
    it('should return change events from the API', async () => {
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
      ]
      const response = { content, pageNumber: 1, totalElements: 1, totalPages: 1 } as EventReviewSearchResults
      fakeActivitiesApi
        .get('/event-review/prison/MDI')
        .query({ date: '2023-01-01', page: 0, size: 10 })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)
      const output = await activitiesApiClient.getChangeEvents('MDI', '2023-01-01', 0, 10, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('acknowledgeChangeEvents', () => {
    it('should acknowledge change events', async () => {
      const request = { eventReviewIds: [1, 2, 3] } as EventAcknowledgeRequest
      fakeActivitiesApi
        .post('/event-review/prison/MDI/acknowledge')
        .matchHeader('authorization', `Bearer token`)
        .reply(204)
      await activitiesApiClient.acknowledgeChangeEvents('MDI', request, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('allocationSuitability', () => {
    it('should return allocation suitability', async () => {
      fakeActivitiesApi
        .get(`/schedules/1/suitability`)
        .query({ prisonerNumber: 'AA1234BC' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200)
      await activitiesApiClient.allocationSuitability(1, 'AA1234BC', user)
      expect(nock.isDone()).toBe(true)
    })
  })
})
