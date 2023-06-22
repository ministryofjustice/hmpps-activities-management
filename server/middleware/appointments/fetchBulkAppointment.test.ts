import type { Request, Response } from 'express'
import { when } from 'jest-when'
import fetchBulkAppointment from './fetchBulkAppointment'
import { BulkAppointmentDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'

jest.mock('../../services/activitiesService')

let req: Request
let res: Response

const next = jest.fn()

const activitiesServiceMock = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

const middleware = fetchBulkAppointment(activitiesServiceMock)

describe('fetchBulkAppointment', () => {
  beforeEach(() => {
    req = {
      params: {
        bulkAppointmentId: 123,
      },
    } as unknown as Request
    res = {
      locals: {
        user: {} as ServiceUser,
      },
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should retrieve bulk appointment from route param', async () => {
    const bulkAppointmentDetails = {
      id: 123,
    } as BulkAppointmentDetails

    when(activitiesServiceMock.getBulkAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(bulkAppointmentDetails)

    await middleware(req, res, next)

    expect(req.bulkAppointment).toEqual(bulkAppointmentDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should catch errors while retrieving bulk appointment and pass to next', async () => {
    when(activitiesServiceMock.getBulkAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})
