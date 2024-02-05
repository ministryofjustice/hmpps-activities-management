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
  AppointmentSeries,
  AppointmentSeriesDetails,
  AppointmentDetails,
  AppointmentCategorySummary,
  AppointmentLocationSummary,
  AppointmentSeriesCreateRequest,
  PrisonerDeallocationRequest,
  EventAcknowledgeRequest,
  EventReview,
  EventReviewSearchResults,
  AppointmentSetCreateRequest,
  AppointmentSetAppointment,
  AppointmentSetDetails,
  WaitingListApplicationRequest,
  WaitingListApplicationUpdateRequest,
  AppointmentUpdateRequest,
  AppointmentAttendanceRequest,
} from '../@types/activitiesAPI/types'
import TimeSlot from '../enum/timeSlot'
import { AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentApplyTo } from '../@types/appointments'
import { formatIsoDate } from '../utils/datePickerUtils'

const user = { token: 'token', activeCaseLoadId: 'MDI' } as ServiceUser

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
      fakeActivitiesApi
        .get('/activities/1/filtered')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)
      const output = await activitiesApiClient.getActivity(1, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivityCategories', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/activity-categories')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)
      const output = await activitiesApiClient.getActivityCategories(user)
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
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)
      const output = await activitiesApiClient.getActivities('MDI', true, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getActivitySchedule', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi
        .get('/schedules/1')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)
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
        .matchHeader('Caseload-Id', 'MDI')
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
      fakeActivitiesApi
        .get('/scheduled-instances/1')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

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
        .matchHeader('Caseload-Id', 'MDI')
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
          exclusions: [],
        })
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(204)

      await activitiesApiClient.postAllocation(1, 'ABC123', 1, user, '2023-01-01', null, [])

      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPayBandsForPrison', () => {
    it('should return data from api', async () => {
      fakeActivitiesApi
        .get('/prison/MDI/prison-pay-bands')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(204)

      await activitiesApiClient.getPayBandsForPrison('MDI', user)

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
  })

  describe('getRolloutPrisons', () => {
    it('should return list of all rolled out prisons from api', async () => {
      const response = { data: 'data' }
      fakeActivitiesApi.get('/rollout').matchHeader('authorization', `Bearer accessToken`).reply(200, response)
      const output = await activitiesApiClient.getRolledOutPrisons()
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAttendees', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeActivitiesApi
        .get('/scheduled-instances/123/scheduled-attendees')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAttendees(123, user)
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
        .matchHeader('Caseload-Id', 'MDI')
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
        .matchHeader('Caseload-Id', 'MDI')
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
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAllocations(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAllocationsWithParams', () => {
    it('should return data from api', async () => {
      const response = [
        {
          id: 1,
          prisonerNumber: '1234567',
        },
      ] as Allocation[]

      fakeActivitiesApi
        .get('/schedules/1/allocations?date=2023-01-01')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAllocationsWithParams(1, { date: '2023-01-01' }, user)

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
        .matchHeader('Caseload-Id', 'MDI')
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
        .matchHeader('Caseload-Id', 'MDI')
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
        .matchHeader('Caseload-Id', 'MDI')
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

  describe('getAppointmentSeriesDetails', () => {
    it('should return appointment series details from api when valid appointment series id is used', async () => {
      const response = {
        id: 12345,
      } as AppointmentSeriesDetails

      fakeActivitiesApi
        .get('/appointment-series/12345/details')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentSeriesDetails(12345, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointmentDetails', () => {
    it('should return appointment details from api when valid appointment id is used', async () => {
      const response = {
        id: 123456,
      } as AppointmentDetails

      fakeActivitiesApi
        .get('/appointments/123456/details')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentDetails(123456, user)
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

      fakeActivitiesApi
        .get('/appointment-categories')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

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
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentLocations('MDI', user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postCreateAppointmentSeries', () => {
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

      const response = {
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
            internalLocationId: 123,
            startDate: '2023-02-07',
            startTime: '13:00',
            endTime: '13:30',
            extraInformation: 'This appointment has been rescheduled due to staff availability',
            createdTime: '2023-02-07T15:37:59.266Z',
            createdBy: 'AAA01U',
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

      fakeActivitiesApi
        .post('/appointment-series', request)
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.postCreateAppointmentSeries(request, user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('putCancelScheduledActivity', () => {
    it('should cancel scheduled activity', async () => {
      fakeActivitiesApi
        .put('/scheduled-instances/1/cancel')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)

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
      fakeActivitiesApi
        .put('/scheduled-instances/1/uncancel')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)

      const body = {
        username: 'USER1',
        displayName: 'John Smith',
      }

      await activitiesApiClient.putUncancelScheduledActivity(1, body, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('patchUpdateAppointment', () => {
    it('should update an appointment', async () => {
      fakeActivitiesApi
        .patch('/appointments/1')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(201)

      const body = {
        startDate: '2023-02-07',
        startTime: '13:00',
        endTime: '13:30',
        applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
      } as AppointmentUpdateRequest

      await activitiesApiClient.patchUpdateAppointment(1, body, user)
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
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getActivityCandidates(1, user, ['Basic'], ['RHI'], true, 'test', 2)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postCreateAppointmentSet', () => {
    it('should successfully post data to api', async () => {
      const request = {
        prisonCode: 'MDI',
        categoryCode: 'ACTI',
        internalLocationId: 27223,
        inCell: false,
        startDate: '2023-05-16',
        appointments: [
          { prisonerNumber: 'A1349DZ', startTime: '13:30', endTime: '14:30', comment: '' } as AppointmentSetAppointment,
          { prisonerNumber: 'A1350DZ', startTime: '15:00', endTime: '15:00', comment: '' } as AppointmentSetAppointment,
        ],
      } as AppointmentSetCreateRequest

      const response = {
        id: 10,
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
        .post('/appointment-set', request)
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.postCreateAppointmentSet(request, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointmentSetDetails', () => {
    it('should return appointment set details from api when valid appointment set id is used', async () => {
      const response = {
        id: 12345,
      } as AppointmentSetDetails

      fakeActivitiesApi
        .get('/appointment-set/12345/details')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)

      const output = await activitiesApiClient.getAppointmentSetDetails(12345, user)
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
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200, response)
      const output = await activitiesApiClient.getDeallocationReasons(user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('putDeallocateFromActivity', () => {
    it('should deallocation prisoners', async () => {
      fakeActivitiesApi
        .put('/schedules/1/deallocate')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(204)

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
        .matchHeader('Caseload-Id', 'MDI')
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
        .matchHeader('Caseload-Id', 'MDI')
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
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.allocationSuitability(1, 'AA1234BC', user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('postWaitlistApplication', () => {
    it('should call endpoint to post the waitlist application', async () => {
      const request = { status: 'PENDING' } as WaitingListApplicationRequest
      fakeActivitiesApi
        .post('/allocations/MDI/waiting-list-application')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.postWaitlistApplication(request, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('fetchActivityWaitlist', () => {
    it('should call endpoint to fetch the waitlist applications for an activity', async () => {
      fakeActivitiesApi
        .get('/schedules/1/waiting-list-applications')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.fetchActivityWaitlist(1, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('fetchWaitlistApplication', () => {
    it('should call endpoint to fetch a waitlist application by id', async () => {
      fakeActivitiesApi
        .get('/waiting-list-applications/1')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.fetchWaitlistApplication(1, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('patchWaitlistApplication', () => {
    it('should call endpoint to patch the waitlist application', async () => {
      const request = { status: 'PENDING' } as WaitingListApplicationUpdateRequest
      fakeActivitiesApi
        .patch('/waiting-list-applications/1')
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.patchWaitlistApplication(1, request, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getAppointmentAttendanceSummaries', () => {
    it('should call endpoint to get appointment attendance summaries', async () => {
      const prisonCode = 'MDI'
      const date = formatIsoDate(new Date())
      fakeActivitiesApi
        .get(`/appointments/${prisonCode}/attendance-summaries`)
        .query({ date })
        .matchHeader('authorization', 'Bearer token')
        .matchHeader('Caseload-Id', prisonCode)
        .reply(200)
      await activitiesApiClient.getAppointmentAttendanceSummaries('MDI', date, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('putAppointmentAttendance', () => {
    it('should call endpoint to put the appointment attendance', async () => {
      const appointmentId = 1
      const request = {
        attendedPrisonNumbers: ['A1234BC'],
        nonAttendedPrisonNumbers: ['B2345CD'],
      } as AppointmentAttendanceRequest
      fakeActivitiesApi
        .put(`/appointments/${appointmentId}/attendance`)
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.putAppointmentAttendance(1, request, user)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchWaitingListApplications', () => {
    it('should call endpoint to search waiting list applications', async () => {
      fakeActivitiesApi
        .post(`/waiting-list-applications/MDI/search`)
        .query({ page: 1, pageSize: 50 })
        .matchHeader('authorization', `Bearer token`)
        .matchHeader('Caseload-Id', 'MDI')
        .reply(200)
      await activitiesApiClient.searchWaitingListApplications(
        'MDI',
        { prisonerNumbers: ['ABC1234'] },
        { page: 1, pageSize: 50 },
        user,
      )
      expect(nock.isDone()).toBe(true)
    })
  })
})
