import type { Request, Response } from 'express'
import { when } from 'jest-when'
import fetchAppointmentSet from './fetchAppointmentSet'
import { AppointmentSetDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'

jest.mock('../../services/activitiesService')

let req: Request
let res: Response

const next = jest.fn()

const activitiesServiceMock = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const middleware = fetchAppointmentSet(activitiesServiceMock)

describe('fetchAppointmentSet', () => {
  beforeEach(() => {
    req = {
      params: {
        appointmentSetId: 123,
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
    } as AppointmentSetDetails

    when(activitiesServiceMock.getAppointmentSetDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(bulkAppointmentDetails)

    await middleware(req, res, next)

    expect(req.appointmentSet).toEqual(bulkAppointmentDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should not retrieve bulk appointment if already on request', async () => {
    const bulkAppointmentDetails = {
      id: 123,
    } as AppointmentSetDetails

    req.appointmentSet = bulkAppointmentDetails

    await middleware(req, res, next)

    expect(activitiesServiceMock.getAppointmentSetDetails).not.toBeCalled()
    expect(req.appointmentSet).toEqual(bulkAppointmentDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should catch errors while retrieving bulk appointment and pass to next', async () => {
    when(activitiesServiceMock.getAppointmentSetDetails)
      .calledWith(123, res.locals.user)
      .mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})