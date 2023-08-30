import type { Request, Response } from 'express'
import { when } from 'jest-when'
import { AppointmentOccurrenceDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'
import fetchAppointmentOccurrence from './fetchAppointmentOccurrence'

jest.mock('../../services/activitiesService')

let req: Request
let res: Response

const next = jest.fn()

const activitiesServiceMock = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const middleware = fetchAppointmentOccurrence(activitiesServiceMock)

describe('fetchAppointment', () => {
  beforeEach(() => {
    req = {
      params: {
        appointmentId: 2,
        occurrenceId: 123,
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

  it('should retrieve appointment occurrence from route param', async () => {
    const occurrenceDetails = {
      id: 123,
      category: {
        code: 'CHAP',
        description: 'Chaplaincy',
      },
      startDate: '2023-04-13',
      startTime: '09:00',
      endTime: '10:30',
      appointmentType: 'INDIVIDUAL',
    } as unknown as AppointmentOccurrenceDetails

    when(activitiesServiceMock.getAppointmentOccurrenceDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(occurrenceDetails)

    await middleware(req, res, next)

    expect(req.appointmentOccurrence).toEqual(occurrenceDetails)
    expect(next).toBeCalledTimes(1)
  })

  it('should catch errors while retrieving appointment occurrence and pass to next', async () => {
    when(activitiesServiceMock.getAppointmentOccurrenceDetails)
      .calledWith(123, res.locals.user)
      .mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})
