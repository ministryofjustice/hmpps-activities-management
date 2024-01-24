import type { Request, Response } from 'express'
import { when } from 'jest-when'
import { startOfTomorrow } from 'date-fns'
import { AppointmentDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'
import fetchAppointment from './fetchAppointment'
import { toDateString } from '../../utils/utils'

jest.mock('../../services/activitiesService')

let req: Request
let res: Response

const next = jest.fn()

const activitiesServiceMock = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const middleware = fetchAppointment(activitiesServiceMock)

describe('fetchAppointment', () => {
  beforeEach(() => {
    req = {
      params: {
        appointmentId: 123,
      },
    } as unknown as Request
    res = {
      locals: {
        user: {
          displayName: 'Joe Bloggs',
          activeCaseLoadId: 'PVI',
        } as ServiceUser,
      },
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should retrieve appointment from route param', async () => {
    const appointmentDetails = {
      id: 123,
      category: {
        code: 'CHAP',
        description: 'Chaplaincy',
      },
      startDate: '2023-04-13',
      startTime: '09:00',
      endTime: '10:30',
      appointmentType: 'INDIVIDUAL',
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    await middleware(req, res, next)

    expect(req.appointment).toEqual(appointmentDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should order attendee list by lastname, firstname', async () => {
    const appointmentDetails = {
      startDate: toDateString(new Date()),
      attendees: [
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    await middleware(req, res, next)

    expect(req.appointment).toEqual({
      startDate: toDateString(new Date()),
      attendees: [
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    })
    expect(next).toBeCalledTimes(1)
  })

  it('should exclude inactive prisoners at the prison from today', async () => {
    const appointmentDetails = {
      startDate: toDateString(new Date()),
      attendees: [
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'INACTIVE OUT',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    await middleware(req, res, next)

    expect(req.appointment).toEqual({
      startDate: toDateString(new Date()),
      attendees: [
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    })
    expect(next).toBeCalledTimes(1)
  })

  it('should exclude inactive prisoners at the prison in future', async () => {
    const appointmentDetails = {
      startDate: toDateString(startOfTomorrow()),
      attendees: [
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'INACTIVE OUT',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    await middleware(req, res, next)

    expect(req.appointment).toEqual({
      startDate: toDateString(startOfTomorrow()),
      attendees: [
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    })
    expect(next).toBeCalledTimes(1)
  })

  it('should include inactive prisoners at the prison for date in past', async () => {
    const appointmentDetails = {
      startDate: '2024-01-23',
      attendees: [
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'INACTIVE OUT',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    await middleware(req, res, next)

    expect(req.appointment).toEqual({
      startDate: '2024-01-23',
      attendees: [
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'INACTIVE OUT',
          },
        },
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonCode: 'PVI',
            status: 'ACTIVE IN',
          },
        },
      ],
    })
    expect(next).toBeCalledTimes(1)
  })

  it('should catch errors while retrieving appointment and pass to next', async () => {
    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})
