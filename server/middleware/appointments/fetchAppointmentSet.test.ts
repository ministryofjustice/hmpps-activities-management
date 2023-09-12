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

  it('should retrieve appointment set from route param', async () => {
    const appointmentSetDetails = {
      id: 123,
    } as AppointmentSetDetails

    when(activitiesServiceMock.getAppointmentSetDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentSetDetails)

    await middleware(req, res, next)

    expect(req.appointmentSet).toEqual(appointmentSetDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should not retrieve appointment set if already on request', async () => {
    const appointmentSetDetails = {
      id: 123,
    } as AppointmentSetDetails

    req.appointmentSet = appointmentSetDetails

    await middleware(req, res, next)

    expect(activitiesServiceMock.getAppointmentSetDetails).not.toBeCalled()
    expect(req.appointmentSet).toEqual(appointmentSetDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should catch errors while retrieving appointment set and pass to next', async () => {
    when(activitiesServiceMock.getAppointmentSetDetails)
      .calledWith(123, res.locals.user)
      .mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})
