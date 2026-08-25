import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import ConfirmationRoutes from './confirmation'
import { AppointmentDetails, AppointmentSetDetails } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'

describe('Route Handlers - Create Appointment - Confirmation', () => {
  const handler = new ConfirmationRoutes()
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

    it('should offer prisoner actions without changing the completed journey for a single attendee', async () => {
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

      const completedJourney = req.journeyData.appointmentJourney

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
            href: '/appointments/create/start-prisoner/A1234BC/name',
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
      expect(req.journeyData.appointmentJourney).toBe(completedJourney)
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
      expect(req.journeyData.appointmentJourney).toBeDefined()
    })

    it('should not change the completed journey or its metrics', async () => {
      const completedJourney = req.journeyData.appointmentJourney
      const completedMetrics = req.session.journeyMetrics

      await handler.GET(req, res)

      expect(req.journeyData.appointmentJourney).toBe(completedJourney)
      expect(req.session.journeyMetrics).toBe(completedMetrics)
    })

    it('should render a retrospective confirmation consistently on refresh', async () => {
      req.journeyData.appointmentJourney.retrospective = YesNo.YES
      req.journeyData.appointmentJourney.confirmation = { id: 11 }
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
            },
          },
        ],
      } as AppointmentDetails

      const completedJourney = req.journeyData.appointmentJourney
      const completedMetrics = req.session.journeyMetrics

      await handler.GET(req, res)
      await handler.GET(req, res)

      expect(req.journeyData.appointmentJourney).toBe(completedJourney)
      expect(req.journeyData.appointmentJourney.retrospective).toEqual(YesNo.YES)
      expect(req.session.journeyMetrics).toBe(completedMetrics)
      expect(res.render).toHaveBeenCalledTimes(2)
      expect((res.render as jest.Mock).mock.calls[0][1]).toEqual((res.render as jest.Mock).mock.calls[1][1])
      expect((res.render as jest.Mock).mock.calls[1][1].actions).toEqual([
        {
          href: '/appointments',
          text: 'Schedule an appointment',
          dataQa: 'create-another-link',
        },
        {
          href: '/appointments/create/start-prisoner/A1234BC/name',
          text: 'Schedule another appointment for John Smith',
          dataQa: 'create-another-for-prisoner-link',
        },
        {
          href: 'https://prisoner-dev.digital.prison.service.justice.gov.uk/prisoner/A1234BC',
          text: 'Go to John Smith’s prisoner profile',
          dataQa: 'prisoner-profile-link',
        },
        {
          href: '/appointments/attendance/11/select-appointment',
          text: 'Record appointment attendance',
          dataQa: 'record-attendance-link',
        },
      ])
    })
  })

  describe('GET_SET', () => {
    it('should render the confirmation page with appointment set details', async () => {
      req.session.journeyMetrics.source = null

      await handler.GET_SET(req, res)

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

    it('should offer prisoner actions without changing the completed journey for a one-person appointment set', async () => {
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

      const completedJourney = req.journeyData.appointmentJourney
      const completedSetJourney = req.journeyData.appointmentSetJourney

      await handler.GET_SET(req, res)

      const renderContext = (res.render as jest.Mock).mock.calls[0][1]
      expect(renderContext.actions).toEqual([
        {
          href: '/appointments',
          text: 'Schedule an appointment',
          dataQa: 'create-another-link',
        },
        {
          href: '/appointments/create/start-prisoner/A1234BC/name',
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
      expect(req.journeyData.appointmentJourney).toBe(completedJourney)
      expect(req.journeyData.appointmentSetJourney).toBe(completedSetJourney)
    })

    it('should not change the completed journeys or their metrics', async () => {
      const completedJourney = req.journeyData.appointmentJourney
      const completedSetJourney = req.journeyData.appointmentSetJourney
      const completedMetrics = req.session.journeyMetrics

      await handler.GET_SET(req, res)

      expect(req.journeyData.appointmentJourney).toBe(completedJourney)
      expect(req.journeyData.appointmentSetJourney).toBe(completedSetJourney)
      expect(req.session.journeyMetrics).toBe(completedMetrics)
    })
  })
})
