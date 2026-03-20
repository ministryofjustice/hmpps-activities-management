import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { ServiceUser } from '../@types/express'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import {
  AmendVideoBookingRequest,
  CreateVideoBookingRequest,
  VideoBookingSearchRequest,
} from '../@types/bookAVideoLinkApi/types'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('bookAVideoLinkApiClient', () => {
  let fakeBookAVideoLinkApi: nock.Scope
  let bookAVideoLinkApiClient: BookAVideoLinkApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    fakeBookAVideoLinkApi = nock(config.apis.bookAVideoLinkApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('get video link by id', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .get('/video-link-booking/id/1')
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getVideoLinkBookingById(1, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('match video link booking by appointment details', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }
      const requestBody = {
        prisonerNumber: 'ABC123',
        locationKey: 'locationKey',
        date: '2024-02-20',
        startTime: '14:00',
        endTime: '15:00',
      } as VideoBookingSearchRequest

      fakeBookAVideoLinkApi
        .post('/video-link-booking/search', requestBody)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.matchAppointmentToVideoLinkBooking(requestBody, user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get appointment locations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .get(`/prisons/MDI/locations?videoLinkOnly=false`)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAppointmentLocations('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get courts', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .get(`/courts?enabledOnly=false`)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAllCourts(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get probation teams', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .get(`/probation-teams?enabledOnly=false`)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAllProbationTeams(user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('get reference codes by group', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .get(`/reference-codes/group/GROUP`)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getReferenceCodesForGroup('GROUP', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('createVideoLinkBooking', () => {
    it('should post the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .post('/video-link-booking', { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(201, response)

      const output = await bookAVideoLinkApiClient.createVideoLinkBooking(
        { bookingType: 'COURT' } as CreateVideoBookingRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('amendVideoLinkBooking', () => {
    it('should put the correct data', async () => {
      const response = { data: 'data' }

      fakeBookAVideoLinkApi
        .put(`/video-link-booking/id/1`, { bookingType: 'COURT' })
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.amendVideoLinkBooking(
        1,
        { bookingType: 'COURT' } as AmendVideoBookingRequest,
        user,
      )
      expect(output).toEqual(response)
    })
  })

  describe('cancelVideoLinkBooking', () => {
    it('should delete', async () => {
      fakeBookAVideoLinkApi
        .delete(`/video-link-booking/id/1`)
        .matchHeader('authorization', `Bearer test-system-token`)
        .reply(200)

      await bookAVideoLinkApiClient.cancelVideoLinkBooking(1, user)

      expect(nock.isDone()).toBe(true)
    })
  })
})
