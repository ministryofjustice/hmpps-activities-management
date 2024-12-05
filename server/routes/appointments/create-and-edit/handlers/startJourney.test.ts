import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { when } from 'jest-when'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import StartJourneyRoutes from './startJourney'
import { AppointmentSeriesDetails, AppointmentDetails } from '../../../../@types/activitiesAPI/types'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { YesNo } from '../../../../@types/activities'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import MetricsService from '../../../../services/metricsService'
import AppointeeAttendeeService from '../../../../services/appointeeAttendeeService'
import MetricsEvent from '../../../../data/metricsEvent'
import { MetricsEventType } from '../../../../@types/metricsEvents'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import EventOrganiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'
import atLeast from '../../../../../jest.setup'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/metricsService')
jest.mock('../../../../services/appointeeAttendeeService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>
const appointeeAttendeeService = new AppointeeAttendeeService(null) as jest.Mocked<AppointeeAttendeeService>

describe('Route Handlers - Create Appointment - Start', () => {
  const handler = new StartJourneyRoutes(prisonService, metricsService, appointeeAttendeeService)
  let req: Request
  let res: Response
  const journeyId = uuidv4()
  const appointmentSeries = {
    appointmentName: 'Appointment name (Chaplaincy)',
    appointments: [
      {
        id: 12,
        sequenceNumber: 2,
        startDate: '2023-04-20',
      },
      {
        id: 13,
        sequenceNumber: 3,
        startDate: '2023-04-27',
      },
    ],
  } as unknown as AppointmentSeriesDetails

  const appointment = {
    id: 12,
    appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
    appointmentType: 'GROUP',
    sequenceNumber: 2,
    appointmentName: 'Appointment name (Chaplaincy)',
    category: {
      code: 'CHAP',
      description: 'Chaplaincy',
    },
    internalLocation: {
      id: 26152,
      prisonCode: 'CHAP',
      description: 'Chapel',
    },
    tier: {
      id: 1,
      code: EventTier.TIER_2,
      description: eventTierDescriptions[EventTier.TIER_2],
    },
    organiser: {
      id: 1,
      code: EventOrganiser.EXTERNAL_PROVIDER,
      description: organiserDescriptions[EventOrganiser.EXTERNAL_PROVIDER],
    },
    startDate: '2023-04-13',
    startTime: '09:00',
    endTime: '10:00',
    attendees: [
      {
        prisoner: {
          prisonerNumber: 'A1234BC',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
        },
      },
      {
        prisoner: {
          prisonerNumber: 'B2345CD',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
        },
      },
    ],
  } as AppointmentDetails

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
      params: { journeyId },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GROUP', () => {
    it('should populate the session with group appointment journey type and redirect to how to add prisoners page', async () => {
      await handler.GROUP(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        createJourneyComplete: false,
        prisoners: [],
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toEqual('startLink')

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('journeySource', 'startLink'),
      )

      expect(res.redirect).toHaveBeenCalledWith('how-to-add-prisoners')
    })
  })

  describe('SET', () => {
    it('should populate the session with appointment set journey type and redirect to upload by csv page', async () => {
      await handler.SET(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.SET,
        createJourneyComplete: false,
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toEqual({
        appointments: [],
      })

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_SET_JOURNEY_STARTED, res.locals.user).addProperty(
          'journeyId',
          journeyId,
        ),
      )

      expect(res.redirect).toHaveBeenCalledWith('upload-appointment-set')
    })
  })

  describe('COPY', () => {
    it('should set mode, original appointment id and redirect', async () => {
      req.appointment = appointment

      when(appointeeAttendeeService.findUnavailableAttendees)
        .calledWith(atLeast(['A1234BC', 'B2345CD'], res.locals.user))
        .mockResolvedValueOnce([])

      await handler.COPY(req, res)

      expect(req.session.appointmentJourney).toEqual(expectedJourney(AppointmentJourneyMode.COPY, appointment.id))
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user).addProperty(
          'journeyId',
          journeyId,
        ),
      )

      expect(res.redirect).toHaveBeenCalledWith('../review-prisoners')
    })

    it('should remove any prisoners who are unavailable', async () => {
      req.appointment = appointment

      when(appointeeAttendeeService.findUnavailableAttendees)
        .calledWith(atLeast(['A1234BC', 'B2345CD'], res.locals.user))
        .mockResolvedValueOnce(['A1234BC'])

      await handler.COPY(req, res)

      expect(req.session.appointmentJourney.prisoners.map(p => p.number)).toEqual(['B2345CD'])

      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user).addProperty(
          'journeyId',
          journeyId,
        ),
      )

      expect(res.redirect).toHaveBeenCalledWith('../review-prisoners')
    })

    it('should render no attendees view if no attendees remain', async () => {
      req.appointment = appointment

      when(appointeeAttendeeService.findUnavailableAttendees)
        .calledWith(atLeast(['A1234BC', 'B2345CD'], res.locals.user))
        .mockResolvedValueOnce(['A1234BC', 'B2345CD'])

      await handler.COPY(req, res)

      expect(req.session.appointmentJourney.prisoners).toHaveLength(0)

      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user).addProperty(
          'journeyId',
          journeyId,
        ),
      )

      expect(res.redirect).toHaveBeenCalledWith('../no-attendees')
    })
  })

  describe('PRISONER', () => {
    beforeEach(() => {
      req.params.prisonNumber = 'A1234BC'
    })

    it('should populate the session with group appointment journey type and redirect to select prisoner page if prisoner number not found', async () => {
      when(prisonService.getInmateByPrisonerNumber).calledWith('A1234BC', res.locals.user).mockResolvedValue(null)
      await handler.PRISONER(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        createJourneyComplete: false,
        prisoners: [],
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toEqual('prisonerProfile')

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('journeySource', 'prisonerProfile'),
      )

      expect(res.redirect).toHaveBeenCalledWith('select-prisoner?query=A1234BC')
    })

    it('should populate the session with group appointment journey type and redirect to review prisoners page if prisoner number found', async () => {
      const prisonerInfo = {
        prisonerNumber: 'A1234BC',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('A1234BC', res.locals.user)
        .mockResolvedValue(prisonerInfo)
      await handler.PRISONER(req, res)

      expect(req.session.appointmentJourney).toEqual({
        mode: AppointmentJourneyMode.CREATE,
        type: AppointmentType.GROUP,
        createJourneyComplete: false,
        prisoners: [
          {
            cellLocation: '1-1-1',
            name: 'John Smith',
            firstName: 'John',
            lastName: 'Smith',
            number: 'A1234BC',
          },
        ],
        fromPrisonNumberProfile: 'A1234BC',
      })
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toEqual('prisonerProfile')

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('journeySource', 'prisonerProfile'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../review-prisoners')
    })
  })

  const expectedJourney = (mode: AppointmentJourneyMode, originalAppointmentId?: number) => {
    return {
      originalAppointmentId,
      mode,
      type: AppointmentType.GROUP,
      appointmentName: 'Appointment name (Chaplaincy)',
      prisoners: [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          cellLocation: '2-2-2',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
      ],
      category: {
        code: 'CHAP',
        description: 'Chaplaincy',
      },
      tierCode: EventTier.TIER_2,
      organiserCode: EventOrganiser.EXTERNAL_PROVIDER,
      location: {
        id: 26152,
        prisonCode: 'CHAP',
        description: 'Chapel',
      },
      startDate: '2023-04-13',
      startTime: {
        date: new Date('2023-04-13 09:00:00'),
        hour: 9,
        minute: 0,
      },
      endTime: {
        date: new Date('2023-04-13 10:00:00'),
        hour: 10,
        minute: 0,
      },
      repeat: YesNo.YES,
      numberOfAppointments: 3,
      frequency: 'WEEKLY',
    } as AppointmentJourney
  }

  describe('EDIT', () => {
    beforeEach(() => {
      req = {
        session: {},
        params: { journeyId },
        appointmentSeries,
        appointment,
      } as unknown as Request
    })

    it('should redirect back if property is not specified', async () => {
      req.params = {}

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney).toBeUndefined()
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toBeUndefined()
      expect(req.session.journeyMetrics).toBeUndefined()
      expect(metricsService.trackEvent).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should redirect back if property is empty', async () => {
      req.params = {
        property: '',
      }

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney).toBeUndefined()
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toBeUndefined()
      expect(req.session.journeyMetrics).toBeUndefined()
      expect(metricsService.trackEvent).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should populate the session with appointment details and redirect to the correct edit route', async () => {
      req.params = {
        journeyId,
        property: 'location',
      }

      const appointmentJourneySession = expectedJourney(AppointmentJourneyMode.EDIT)

      const editAppointmentJourneySession = {
        numberOfAppointments: 3,
        appointments: [
          {
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-04-27',
          },
        ],
        sequenceNumber: 2,
        appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
        property: 'location',
      } as EditAppointmentJourney

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney).toEqual(appointmentJourneySession)
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointment.id)
          .addProperty('property', 'location')
          .addProperty('isApplyToQuestionRequired', 'true'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../location')
    })

    it('should accept an invalid end date value', async () => {
      req.appointment.endTime = null
      req.params = {
        property: 'location',
      }

      await handler.EDIT(req, res)

      expect(req.session.appointmentJourney.endTime).toBeNull()
    })
  })

  describe('REMOVE_PRISONER', () => {
    beforeEach(() => {
      req = {
        session: {},
        params: { journeyId },
        appointmentSeries,
        appointment,
      } as unknown as Request
    })

    it('should redirect back if prisoner is not found', async () => {
      req.params = {
        prisonNumber: 'NOT_FOUND',
      }

      await handler.REMOVE_PRISONER(req, res)

      expect(req.session.appointmentJourney).toBeUndefined()
      expect(req.session.editAppointmentJourney).toBeUndefined()
      expect(req.session.appointmentSetJourney).toBeUndefined()
      expect(req.session.journeyMetrics).toBeUndefined()
      expect(metricsService.trackEvent).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should populate the session with prisoner details and redirect to apply to', async () => {
      req.params = {
        journeyId,
        prisonNumber: 'B2345CD',
      }

      const editAppointmentJourneySession = {
        numberOfAppointments: 3,
        appointments: [
          {
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-04-27',
          },
        ],
        sequenceNumber: 2,
        appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
        property: 'remove-prisoner',
        removePrisoner: {
          prisonerNumber: 'B2345CD',
          firstName: 'TEST02',
          lastName: 'PRISONER02',
          cellLocation: '2-2-2',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
        },
      } as EditAppointmentJourney

      await handler.REMOVE_PRISONER(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointment.id)
          .addProperty('property', 'remove-prisoner')
          .addProperty('isApplyToQuestionRequired', 'true'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../remove/apply-to')
    })

    it('should populate the session with prisoner details and redirect to confirm', async () => {
      req.appointmentSeries = {
        ...appointmentSeries,
        appointments: [
          {
            id: 12,
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
        ],
      } as unknown as AppointmentSeriesDetails
      req.params = {
        journeyId,
        prisonNumber: 'A1234BC',
      }

      const editAppointmentJourneySession = {
        numberOfAppointments: 3,
        appointments: [
          {
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
        ],
        sequenceNumber: 2,
        appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
        property: 'remove-prisoner',
        removePrisoner: {
          prisonerNumber: 'A1234BC',
          firstName: 'TEST01',
          lastName: 'PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
        },
      } as EditAppointmentJourney

      await handler.REMOVE_PRISONER(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointment.id)
          .addProperty('property', 'remove-prisoner')
          .addProperty('isApplyToQuestionRequired', 'false'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../remove/confirm')
    })
  })

  describe('ADD_PRISONERS', () => {
    beforeEach(() => {
      req = {
        session: {},
        params: { journeyId },
        appointmentSeries,
        appointment,
      } as unknown as Request
    })

    it('should populate the session and redirect to how to add prisoners', async () => {
      const editAppointmentJourneySession = {
        numberOfAppointments: 3,
        appointments: [
          {
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-04-27',
          },
        ],
        sequenceNumber: 2,
        appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
        property: 'add-prisoners',
        addPrisoners: [],
      } as EditAppointmentJourney

      await handler.ADD_PRISONERS(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointment.id)
          .addProperty('property', 'add-prisoners')
          .addProperty('isApplyToQuestionRequired', 'true'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../../prisoners/add/how-to-add-prisoners')
    })
  })

  describe('CANCEL', () => {
    beforeEach(() => {
      req = {
        session: {},
        params: { journeyId },
        appointmentSeries,
        appointment,
      } as unknown as Request
    })

    it('should populate the session and redirect to cancellation reasons', async () => {
      const editAppointmentJourneySession = {
        numberOfAppointments: 3,
        appointments: [
          {
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-04-27',
          },
        ],
        sequenceNumber: 2,
        appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
      } as EditAppointmentJourney

      await handler.CANCEL(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointment.id)
          .addProperty('isApplyToQuestionRequired', 'true'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../cancel/reason')
    })
  })

  describe('UNCANCEL', () => {
    beforeEach(() => {
      req = {
        session: {},
        params: { journeyId },
        appointmentSeries,
        appointment,
      } as unknown as Request
    })

    it('should populate the session and redirect to confirm screen', async () => {
      const editAppointmentJourneySession = {
        numberOfAppointments: 3,
        appointments: [
          {
            sequenceNumber: 2,
            startDate: '2023-04-20',
          },
          {
            sequenceNumber: 3,
            startDate: '2023-04-27',
          },
        ],
        sequenceNumber: 2,
        appointmentSeries: { id: 2, schedule: { frequency: 'WEEKLY', numberOfAppointments: 3 } },
      } as EditAppointmentJourney

      await handler.UNCANCEL(req, res)

      expect(req.session.appointmentJourney).not.toBeUndefined()
      expect(req.session.editAppointmentJourney).toEqual(editAppointmentJourneySession)
      expect(req.session.appointmentSetJourney).toBeUndefined()

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toBeUndefined()

      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.UNCANCEL_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointment.id)
          .addProperty('isApplyToQuestionRequired', 'true'),
      )

      expect(res.redirect).toHaveBeenCalledWith('../uncancel/confirm')
    })
  })
})
