import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import BookAVideoLinkApiClient from './bookAVideoLinkApiClient'
import { VideoBookingSearchRequest } from '../@types/bookAVideoLinkApi/types'

const user = {} as ServiceUser

jest.mock('./tokenStore')

describe('bookAVideoLinkApiClient', () => {
  let fakeBookAVideoLinkApi: nock.Scope
  let bookAVideoLinkApiClient: BookAVideoLinkApiClient

  beforeEach(() => {
    fakeBookAVideoLinkApi = nock(config.apis.bookAVideoLinkApi.url)
    bookAVideoLinkApiClient = new BookAVideoLinkApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
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
        .matchHeader('authorization', `Bearer accessToken`)
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
        .matchHeader('authorization', `Bearer accessToken`)
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
        .get(`/prisons/MDI/locations`)
        .matchHeader('authorization', `Bearer accessToken`)
        .reply(200, response)

      const output = await bookAVideoLinkApiClient.getAppointmentLocations('MDI', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })
})