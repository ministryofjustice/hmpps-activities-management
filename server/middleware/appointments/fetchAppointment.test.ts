import type { Request, Response } from 'express'
import { when } from 'jest-when'
import { AppointmentDetails } from '../../@types/activitiesAPI/types'
import { ServiceUser } from '../../@types/express'
import ActivitiesService from '../../services/activitiesService'
import fetchAppointment from './fetchAppointment'
import PrisonService from '../../services/prisonService'
import { PrisonerStatus } from '../../@types/prisonApiImportCustom'
import { Prisoner } from '../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../services/activitiesService')
jest.mock('../../services/prisonService')

let req: Request
let res: Response

const next = jest.fn()

const activitiesServiceMock = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonServiceMock = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const middleware = fetchAppointment(activitiesServiceMock, prisonServiceMock)

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
    const prisoner1 = {
      prisonerNumber: '1',
      status: PrisonerStatus.ACTIVE_IN,
      prisonId: 'PVI',
    } as Prisoner

    const prisoner2 = {
      prisonerNumber: '2',
      status: PrisonerStatus.ACTIVE_IN,
      prisonId: 'PVI',
    } as Prisoner

    const prisoner3 = {
      prisonerNumber: '3',
      status: PrisonerStatus.ACTIVE_IN,
      prisonId: 'PVI',
    } as Prisoner

    const appointmentDetails = {
      attendees: [
        {
          prisoner: {
            prisonerNumber: '1',
            firstName: 'C',
            lastName: 'C',
          },
        },
        {
          prisoner: {
            prisonerNumber: '2',
            firstName: 'B',
            lastName: 'C',
          },
        },
        {
          prisoner: {
            prisonerNumber: '3',
            firstName: 'B',
            lastName: 'A',
          },
        },
      ],
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    when(prisonServiceMock.searchInmatesByPrisonerNumbers)
      .calledWith(['1', '2', '3'], res.locals.user)
      .mockResolvedValue([prisoner1, prisoner2, prisoner3])

    await middleware(req, res, next)

    expect(req.appointment).toEqual({
      attendees: [
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonerNumber: '3',
          },
        },
        {
          prisoner: {
            firstName: 'B',
            lastName: 'C',
            prisonerNumber: '2',
          },
        },
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonerNumber: '1',
          },
        },
      ],
    })
    expect(next).toBeCalledTimes(1)
  })

  it('should exclude inactive attendee from appointment details', async () => {
    const prisoner1 = {
      prisonerNumber: '1',
      status: PrisonerStatus.ACTIVE_IN,
      prisonId: 'PVI',
    } as Prisoner

    const prisoner2 = {
      prisonerNumber: '2',
      status: PrisonerStatus.INACTIVE_OUT,
      prisonId: 'PVI',
    } as Prisoner

    const prisoner3 = {
      prisonerNumber: '3',
      status: PrisonerStatus.ACTIVE_IN,
      prisonId: 'PVI',
    } as Prisoner

    const appointmentDetails = {
      attendees: [
        {
          prisoner: {
            prisonerNumber: '1',
            firstName: 'C',
            lastName: 'C',
          },
        },
        {
          prisoner: {
            prisonerNumber: '2',
            firstName: 'inactive',
            lastName: 'prisoner',
          },
        },
        {
          prisoner: {
            prisonerNumber: '3',
            firstName: 'B',
            lastName: 'A',
          },
        },
      ],
    } as unknown as AppointmentDetails

    when(activitiesServiceMock.getAppointmentDetails)
      .calledWith(123, res.locals.user)
      .mockResolvedValue(appointmentDetails)

    when(prisonServiceMock.searchInmatesByPrisonerNumbers)
      .calledWith(['1', '2', '3'], res.locals.user)
      .mockResolvedValue([prisoner1, prisoner2, prisoner3])

    await middleware(req, res, next)

    expect(req.appointment).toEqual({
      attendees: [
        {
          prisoner: {
            firstName: 'B',
            lastName: 'A',
            prisonerNumber: '3',
          },
        },
        {
          prisoner: {
            firstName: 'C',
            lastName: 'C',
            prisonerNumber: '1',
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
