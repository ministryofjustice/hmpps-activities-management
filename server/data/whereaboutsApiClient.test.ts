import nock from 'nock'

import config from '../config'
import TokenStore from './tokenStore'
import { ServiceUser } from '../@types/express'
import WhereaboutsApiClient from './whereaboutsApiClient'
import createAttendanceDto from './fixtures/create_attendance_dto_1.json'
import updateAttendanceDto from './fixtures/update_attendance_dto_1.json'
import { OffenderActivityId } from '../@types/dps'

const user = { token: 'token' } as ServiceUser

jest.mock('./tokenStore')

describe('whereaboutsApiClient', () => {
  let fakeWhereaboutsApi: nock.Scope
  let whereaboutsApiClient: WhereaboutsApiClient

  beforeEach(() => {
    fakeWhereaboutsApi = nock(config.apis.whereaboutsApi.url)
    whereaboutsApiClient = new WhereaboutsApiClient()

    jest.spyOn(TokenStore.prototype, 'getToken').mockResolvedValue('accessToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAttendance', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeWhereaboutsApi
        .get(`/attendances/MDI/10001`)
        .query({ date: '2022-08-01', period: 'AM' })
        .matchHeader('authorization', `Bearer token`)
        .reply(200, response)

      const output = await whereaboutsApiClient.getAttendance('MDI', '10001', '2022-08-01', 'AM', user)

      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('searchActivityLocations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeWhereaboutsApi.get('/absence-reasons').matchHeader('authorization', `Bearer token`).reply(200, response)

      const output = await whereaboutsApiClient.getAbsenceReasons(user)
      expect(output).toEqual(response)
      expect(nock.isDone()).toBe(true)
    })

    describe('createAttendance', () => {
      it('should return data from api', async () => {
        const response = { data: 'data' }

        fakeWhereaboutsApi
          .post('/attendance', { eventDate: '2022-08-01', attendance: createAttendanceDto })
          .matchHeader('authorization', `Bearer token`)
          .reply(200, response)

        const output = await whereaboutsApiClient.createAttendance('2022-08-01', createAttendanceDto, user)
        expect(output).toEqual(response)
        expect(nock.isDone()).toBe(true)
      })
    })

    describe('updateAttendance', () => {
      it('should return data from api', async () => {
        const response = { data: 'data' }

        fakeWhereaboutsApi
          .put('/attendance/1', { id: 1, eventDate: '2022-08-01', attendance: updateAttendanceDto })
          .matchHeader('authorization', `Bearer token`)
          .reply(200, response)

        const output = await whereaboutsApiClient.updateAttendance(1, '2022-08-01', updateAttendanceDto, user)
        expect(output).toEqual(response)
        expect(nock.isDone()).toBe(true)
      })
    })

    describe('batchUpdateAttendance', () => {
      it('should return data from api', async () => {
        const response = { data: 'data' }

        const activities: OffenderActivityId[] = [
          {
            bookingId: 1,
            activityId: 2,
          },
          {
            bookingId: 2,
            activityId: 2,
          },
        ]
        fakeWhereaboutsApi
          .post('/attendances', {
            prisonId: 'MDI',
            eventLocationId: '10001G',
            eventDate: '2022-08-01',
            period: 'AM',
            bookingActivities: activities,
            attended: true,
            paid: true,
            reason: 'reason',
            comments: 'comments',
          })
          .matchHeader('authorization', `Bearer token`)
          .reply(200, response)

        const output = await whereaboutsApiClient.batchUpdateAttendance(
          'MDI',
          '10001G',
          '2022-08-01',
          'AM',
          activities,
          true,
          true,
          'reason',
          'comments',
          user,
        )
        expect(output).toEqual(response)
        expect(nock.isDone()).toBe(true)
      })
    })
  })
})
