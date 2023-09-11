import type { Request, Response } from 'express'
import { when } from 'jest-when'
import fetchAppointmentSeries from './fetchAppointmentSeries'
import { AppointmentSeriesDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'

jest.mock('../../services/activitiesService')

let req: Request
let res: Response

const next = jest.fn()

const activitiesServiceMock = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const middleware = fetchAppointmentSeries(activitiesServiceMock)

describe('fetchAppointmentSeries', () => {
  beforeEach(() => {
    req = {
      params: {
        appointmentSeriesId: 123,
      },
    } as unknown as Request
    res = {
      locals: {
        user: {
          displayName: 'Joe Bloggs',
        } as ServiceUser,
      },
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should retrieve appointment from route param', async () => {
    const appointmentSeriesDetails = {
      id: 123,
      category: {
        code: 'CHAP',
        description: 'Chaplaincy',
      },
      startDate: '2023-04-13',
      startTime: '09:00',
      endTime: '10:30',
      appointmentType: 'INDIVIDUAL',
    } as unknown as AppointmentSeriesDetails

    when(activitiesServiceMock.getAppointmentSeriesDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentSeriesDetails)

    await middleware(req, res, next)

    expect(req.appointmentSeries).toEqual(appointmentSeriesDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should catch errors while retrieving appointment and pass to next', async () => {
    when(activitiesServiceMock.getAppointmentSeriesDetails)
      .calledWith(123, res.locals.user)
      .mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})
