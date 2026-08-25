import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import ConfirmationRoutes from './confirmation'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { MetricsEventType } from '../../../../@types/metricsEvents'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService() as jest.Mocked<MetricsService>

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
      },
      journeyData: {
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
        id: 1,
        appointmentSeries: { id: 2 },
        attendees: [],
      } as AppointmentDetails,
      appointmentSet: { id: 3, appointments: [] } as AppointmentSetDetails,
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
        appointmentJourney: expect.any(Object),
        actions: [
          {
            href: '/appointments',
            text: 'Schedule an appointment',
            dataQa: 'create-another-link',
          },
          {
            href: '/appointments/1',
            text: 'View, manage and print a movement slip for this appointment',
            dataQa: 'view-appointment-link',
          },
        ],
      })
    })

    it('should render the confirmation page with appointment details when duplicating an appointment', async () => {
      req.journeyData.appointmentJourney.originalAppointmentId = 789

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
        appointmentJourney: expect.any(Object),
        actions: [
          {
            href: '/appointments',
            text: 'Schedule an appointment',
            dataQa: 'create-another-link',
          },
          {
            href: '/appointments/1',
            text: 'View, manage and print a movement slip for this appointment',
            dataQa: 'view-appointment-link',
          },
        ],
      })
    })

    it('should offer prisoner actions and prepare a new journey for a single attendee', async () => {
      req.appointment = {
        id: 11,
        appointmentSeries: { id: 2 },
        attendees: [
          {
            prisoner: {
              prisonerNumber: 'A1234BC',
              firstName: 'JOHN',
              lastName: 'SMITH',
              prisonCode: 'TPR',
              status: 'ACTIVE IN',
              cellLocation: '1-1-1',
              category: 'C',
            },
          },
        ],
      } as AppointmentDetails

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirmation', {
        appointment: req.appointment,
        appointmentJourney: expect.any(Object),
        actions: [
          {
            href: '/appointments',
            text: 'Schedule an appointment',
            dataQa: 'create-another-link',
          },
          {
            href: `/appointments/create/${journeyId}/name`,
            text: 'Schedule another appointment for John Smith',
            dataQa: 'create-another-for-prisoner-link',
          },
          {
            href: 'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC',
            text: 'Go to John Smith’s prisoner profile',
            dataQa: 'prisoner-profile-link',
          },
          {
            href: '/appointments/11',
            text: 'View, manage and print a movement slip for this appointment',
            dataQa: 'view-appointment-link',
          },
        ],
      })
      expect(req.journeyData.appointmentJourney).toEqual({
        mode: 'CREATE',
        type: 'GROUP',
        createJourneyComplete: false,
        prisoners: [
          {
            number: 'A1234BC',
            name: 'JOHN SMITH',
            firstName: 'JOHN',
            lastName: 'SMITH',
            prisonCode: 'TPR',
            status: 'ACTIVE IN',
            cellLocation: '1-1-1',
            category: 'C',
          },
        ],
        fromAppointmentConfirmation: true,
      })
    })

    it('should not offer prisoner actions for multiple attendees', async () => {
      req.appointment.attendees = [
        {
          id: 1,
          prisoner: {
            prisonerNumber: 'A1234BC',
            bookingId: 1,
            firstName: 'FIRST',
            lastName: 'PRISONER',
            prisonCode: 'TPR',
            cellLocation: '1-1-1',
          },
        },
        {
          id: 2,
          prisoner: {
            prisonerNumber: 'B2345CD',
            bookingId: 2,
            firstName: 'SECOND',
            lastName: 'PRISONER',
            prisonCode: 'TPR',
            cellLocation: '1-1-2',
          },
        },
      ]

      await handler.GET(req, res)

      const renderContext = (res.render as jest.Mock).mock.calls[0][1]
      expect(renderContext.actions).toEqual([
        {
          href: '/appointments',
          text: 'Schedule an appointment',
          dataQa: 'create-another-link',
        },
        {
          href: '/appointments/1',
          text: 'View, manage and print a movement slip for this appointment',
          dataQa: 'view-appointment-link',
        },
      ])
      expect(req.journeyData.appointmentJourney).toBeNull()
    })

    it('should clear session', async () => {
      await handler.GET(req, res)
      expect(req.journeyData.appointmentJourney).toBeNull()
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
        appointmentJourney: expect.any(Object),
        actions: [
          {
            href: '/appointments',
            text: 'Schedule an appointment',
            dataQa: 'create-another-link',
          },
          {
            href: '/appointments/set/3',
            text: 'View, print movement slips and manage this set of appointments',
            dataQa: 'view-appointment-link',
          },
        ],
      })
    })

    it('should offer prisoner actions and prepare a new journey for a one-person appointment set', async () => {
      req.session.journeyMetrics.source = null
      req.appointmentSet = {
        id: 3,
        appointments: [
          {
            attendees: [
              {
                prisoner: {
                  prisonerNumber: 'A1234BC',
                  firstName: 'JOHN',
                  lastName: 'SMITH',
                  prisonCode: 'TPR',
                  status: 'ACTIVE IN',
                  cellLocation: '1-1-1',
                  category: 'C',
                },
              },
            ],
          },
        ],
      } as AppointmentSetDetails

      await handler.GET_SET(req, res)

      const renderContext = (res.render as jest.Mock).mock.calls[0][1]
      expect(renderContext.actions).toEqual([
        {
          href: '/appointments',
          text: 'Schedule an appointment',
          dataQa: 'create-another-link',
        },
        {
          href: `/appointments/create/${journeyId}/name`,
          text: 'Schedule another appointment for John Smith',
          dataQa: 'create-another-for-prisoner-link',
        },
        {
          href: 'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC',
          text: 'Go to John Smith’s prisoner profile',
          dataQa: 'prisoner-profile-link',
        },
        {
          href: '/appointments/set/3',
          text: 'View, print movement slips and manage this set of appointments',
          dataQa: 'view-appointment-link',
        },
      ])
      expect(req.journeyData.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'JOHN SMITH',
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonCode: 'TPR',
          status: 'ACTIVE IN',
          cellLocation: '1-1-1',
          category: 'C',
        },
      ])
      expect(req.journeyData.appointmentSetJourney).toBeNull()
    })

    it('should clear session', async () => {
      await handler.GET_SET(req, res)
      expect(req.journeyData.appointmentJourney).toBeNull()
      expect(req.journeyData.appointmentSetJourney).toBeNull()
      expect(req.session.journeyMetrics).toBeNull()
    })
  })
})
