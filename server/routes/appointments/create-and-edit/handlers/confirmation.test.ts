import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import ConfirmationRoutes from './confirmation'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { MetricsEventType } from '../../../../@types/metricsEvents'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Create Appointment - Confirmation', () => {
  const handler = new ConfirmationRoutes(metricsService)
  let req: Request
  let res: Response
  const journeyId = randomUUID()

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
    it('should render the confirmation page with appointment details when creating a new appointment', async () => {
      await handler.GET(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
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

    it('should render the confirmation page with appointment details when duplicating an appointment', async () => {
      req.session.appointmentJourney.originalAppointmentId = 789

      await handler.GET(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('journeySource', 'startLink')
          .addProperty('appointmentSeriesId', 2)
          .addProperty('originalId', 789)
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

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
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
