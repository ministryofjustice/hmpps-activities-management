import { Request, Response } from 'express'

import AppointmentMovementSlipRoutes from './appointmentMovementSlip'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Movement Slip', () => {
  const handler = new AppointmentMovementSlipRoutes(metricsService)
  let req: Request
  let res: Response

  const appointment = {
    id: 10,
    appointmentSeries: {
      id: 5,
    },
    sequenceNumber: 2,
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
    extraInformation: '',
    isEdited: false,
    isCancelled: false,
    createdTime: '2023-02-17T10:22:04',
    createdBy: 'jsmith',
    updatedTime: null,
    updatedBy: null,
    attendees: [{ prisoner: { prisonerNumber: 'A1350DZ' } }],
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
      appointment,
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.APPOINTMENT_MOVEMENT_SLIP_PRINTED(appointment, res.locals.user),
      )
      expect(res.render).toHaveBeenCalledWith('pages/appointments/appointment/movement-slip', { appointment })
    })
  })
})
