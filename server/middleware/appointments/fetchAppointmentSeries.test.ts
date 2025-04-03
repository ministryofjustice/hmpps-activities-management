import type { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, subDays } from 'date-fns'
import fetchAppointmentSeries from './fetchAppointmentSeries'
import { AppointmentSeriesDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'
import { AppointmentType } from '../../routes/appointments/create-and-edit/appointmentJourney'
import { formatDate } from '../../utils/utils'

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
      startDate: formatDate(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:30',
      appointmentType: AppointmentType.GROUP,
    } as unknown as AppointmentSeriesDetails

    appointmentSeriesDetails.appointments = [
      {
        id: 100,
        sequenceNumber: 1,
        startDate: formatDate(subDays(Date(), 1), 'yyyy-MM-dd'),
        startTime: '18:00',
      },
      {
        id: 101,
        sequenceNumber: 2,
        startDate: formatDate(new Date(), 'yyyy-MM-dd'),
        startTime: '00:00',
      },
      {
        id: 102,
        sequenceNumber: 3,
        startDate: formatDate(new Date(), 'yyyy-MM-dd'),
        startTime: '15:00',
      },
      {
        id: 103,
        sequenceNumber: 4,
        startDate: formatDate(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
      },
      {
        id: 104,
        sequenceNumber: 5,
        startDate: formatDate(addDays(Date(), 1), 'yyyy-MM-dd'),
        startTime: '12:00',
      },
    ] as unknown as AppointmentSeriesDetails['appointments']

    when(activitiesServiceMock.getAppointmentSeriesDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentSeriesDetails)

    await middleware(req, res, next)
    expect(req.appointmentSeries.appointments.length).toEqual(4)
    expect(req.appointmentSeries.appointments.filter(appointment => appointment.id === 100).length).toEqual(0)
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
