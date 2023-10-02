import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import ConfirmationRoutes from './confirmation'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent, { MetricsEventType } from '../../../../data/metricsEvent'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Create Appointment - Confirmation', () => {
  const handler = new ConfirmationRoutes(metricsService)
  let req: Request
  let res: Response
  const journeyId = uuidv4()

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        journeyMetrics: {
          journeyStartTime: Date.now() - 60000,
          source: 'startLink',
        },
        appointmentJourney: {
          prisoner: {
            number: 'A1234BC',
            name: 'Test Prisoner',
            cellLocation: '1-1-1',
          },
          category: {
            id: 'MEDO',
            description: 'Medical - Doctor',
          },
          location: {
            id: 32,
            description: 'Interview Room',
          },
          startDate: {
            day: 23,
            month: 4,
            year: 2023,
            date: '2023-04-23T00:00:00.000+0100',
          },
          startTime: {
            hour: 9,
            minute: 30,
            date: '2023-04-23T09:30:00.000+0100',
          },
          endTime: {
            hour: 13,
            minute: 0,
            date: '2023-04-23T13:00:00.000+0100',
          },
        },
        appointmentSetJourney: {},
      },
      appointment: {
        appointmentSeries: { id: 2 },
      } as AppointmentDetails,
      appointmentSet: { id: 3 } as AppointmentSetDetails,
      params: {
        journeyId,
        id: '1',
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the confirmation page with appointment details', async () => {
      await handler.GET(req, res)

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('journeySource', 'startLink')
          .addProperty('appointmentSeriesId', 2)
          .addMeasurement('journeyTimeSec', 60),
      )
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirmation', {
        appointment: req.appointment,
      })
    })

    it('should clear session', async () => {
      await handler.GET(req, res)
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.journeyMetrics).toBeNull()
    })
  })

  describe('GET_SET', () => {
    it('should render the confirmation page with appointment set details', async () => {
      req.session.journeyMetrics.source = null

      await handler.GET_SET(req, res)

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_SET_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentSetId', 3)
          .addMeasurement('journeyTimeSec', 60),
      )
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirmation', {
        appointmentSet: req.appointmentSet,
      })
    })

    it('should clear session', async () => {
      await handler.GET_SET(req, res)
      expect(req.session.appointmentJourney).toBeNull()
      expect(req.session.appointmentSetJourney).toBeNull()
      expect(req.session.journeyMetrics).toBeNull()
    })
  })
})
