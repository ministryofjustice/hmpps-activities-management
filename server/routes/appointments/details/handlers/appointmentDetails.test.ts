import { Request, Response } from 'express'
import { when } from 'jest-when'

import AppointmentDetailsRoutes from './appointmentDetails'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/appointments'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Appointment Details', () => {
  const handler = new AppointmentDetailsRoutes(activitiesService)
  let req: Request
  let res: Response

  const appointmentDetails = {
    id: 10,
    category: {
      id: 40,
      parent: null,
      code: 'MEOT',
      description: 'Medical - Other',
      active: true,
      displayOrder: null,
    },
    internalLocation: {
      locationId: 26963,
      locationType: 'RESI',
      description: 'RES-HB1-DOC',
      agencyId: 'MDI',
      parentLocationId: 26960,
      currentOccupancy: 0,
      locationPrefix: 'MDI-RES-HB1-DOC',
      userDescription: 'HB1 Doctors',
    },
    inCell: false,
    startDate: new Date('2023-02-22T00:00:00.000Z'),
    startTime: new Date('2023-02-22T13:00:00.000Z'),
    endTime: new Date('2023-02-22T13:15:00.000Z'),
    comment: '',
    created: new Date('2023-02-17T10:22:04.000Z'),
    createdBy: {
      firstName: 'John',
      lastName: 'Smith',
    },
    updated: null,
    updatedBy: null,
    occurrences: [{ id: 10 }],
    prisoners: [{ prisonerNumber: 'A1350DZ' }],
  } as AppointmentDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        id: '10',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getAppointmentDetails)
        .calledWith(10, res.locals.user)
        .mockResolvedValue(appointmentDetails)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/details/appointment', {
        appointment: appointmentDetails,
      })
    })
  })
})
