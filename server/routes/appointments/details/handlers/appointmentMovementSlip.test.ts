import { Request, Response } from 'express'
import { when } from 'jest-when'

import AppointmentMovementSlipRoutes from './appointmentMovementSlip'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Movement Slip', () => {
  const handler = new AppointmentMovementSlipRoutes(activitiesService)
  let req: Request
  let res: Response

  const appointmentDetails = {
    id: 10,
    category: {
      code: 'MEOT',
      description: 'Medical - Other',
    },
    prisonCode: 'MDI',
    internalLocation: {
      id: 26963,
      prisonCode: 'MDI',
      description: 'HB1 Doctors',
    },
    inCell: false,
    startDate: '2023-02-22',
    startTime: '13:00',
    endTime: '13:15',
    comment: '',
    created: '2023-02-17T10:22:04',
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/movement-slip/individual', {
        movementSlip: appointmentDetails,
      })
    })
  })
})
