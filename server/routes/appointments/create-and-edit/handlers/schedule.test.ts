import { Request, Response } from 'express'
import { when } from 'jest-when'
import { addDays, startOfToday } from 'date-fns'
import ScheduleRoutes from './schedule'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { InternalLocationEvents, PrisonerScheduledEvents } from '../../../../@types/activitiesAPI/types'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/editAppointmentService')
jest.mock('../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const editAppointmentService = new EditAppointmentService(null, null) as jest.Mocked<EditAppointmentService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Create Appointment - Schedule', () => {
  const handler = new ScheduleRoutes(activitiesService, editAppointmentService, metricsService)
  let req: Request
  let res: Response

  const tomorrow = addDays(startOfToday(), 1)

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
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          startDate: formatIsoDate(tomorrow),
          prisoners: [],
        },
        appointmentSetJourney: {
          appointments: [],
        },
        editAppointmentJourney: {},
      },
      query: {},
      params: {},
      flash: jest.fn(),
    } as unknown as Request

    when(activitiesService.getScheduledEventsForPrisoners).mockResolvedValue({
      activities: [
        { prisonerNumber: 'A1234BC', summary: 'Activity for A1234BC' },
        { prisonerNumber: 'B2345CD', summary: 'Activity for B2345CD' },
        { prisonerNumber: 'B2345CD', summary: 'Second activity for B2345CD', cancelled: true },
      ],
      appointments: [
        { prisonerNumber: 'A1234BC', summary: 'Appointments for A1234BC' },
        { prisonerNumber: 'B2345CD', summary: 'Appointments for B2345CD' },
      ],
      courtHearings: [
        { prisonerNumber: 'A1234BC', summary: 'Court hearing for A1234BC' },
        { prisonerNumber: 'B2345CD', summary: 'Court hearing for B2345CD' },
      ],
      visits: [
        { prisonerNumber: 'A1234BC', summary: 'Visit for A1234BC' },
        { prisonerNumber: 'B2345CD', summary: 'Visit for B2345CD' },
      ],
      externalTransfers: [
        { prisonerNumber: 'A1234BC', summary: 'External transfer for A1234BC' },
        { prisonerNumber: 'B2345CD', summary: 'External transfer for B2345CD' },
      ],
      adjudications: [
        { prisonerNumber: 'A1234BC', summary: 'Adjudication for A1234BC' },
        { prisonerNumber: 'B2345CD', summary: 'Adjudication for B2345CD' },
      ],
    } as PrisonerScheduledEvents)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the schedule view', async () => {
      req.params.appointmentId = '1'
      req.session.appointmentJourney.repeat = YesNo.NO

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        isCtaAcceptAndSave: false,
        prisonerSchedules: [],
        appointmentId: '1',
      })
    })

    it('should render the schedule view with CTA save', async () => {
      req.params.appointmentId = '1'
      req.session.appointmentJourney.type = AppointmentType.GROUP
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        prisonerSchedules: [],
        isCtaAcceptAndSave: true,
        appointmentId: '1',
      })
    })

    it('should render the schedule view with prisoner schedule for new prisoners', async () => {
      req.session.appointmentJourney.type = AppointmentType.GROUP
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        isCtaAcceptAndSave: true,
        prisonerSchedules: [
          {
            prisoner: {
              number: 'A1234BC',
              name: 'TEST01 PRISONER01',
              cellLocation: '1-1-1',
              prisonCode: 'MDI',
              status: 'ACTIVE IN',
            },
            scheduledEvents: [
              { prisonerNumber: 'A1234BC', summary: 'Activity for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Appointments for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Court hearing for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Visit for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'External transfer for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Adjudication for A1234BC' },
            ],
          },
        ],
      })
    })

    it('should render schedule information for appointment journey prisoners', async () => {
      req.session.appointmentJourney.type = AppointmentType.GROUP
      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
      ]

      await handler.GET(req, res)

      expect(activitiesService.getScheduledEventsForPrisoners).toHaveBeenCalledWith(
        tomorrow,
        ['A1234BC'],
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        prisonerSchedules: [
          {
            prisoner: {
              number: 'A1234BC',
              name: 'TEST01 PRISONER01',
              cellLocation: '1-1-1',
              prisonCode: 'MDI',
              status: 'ACTIVE IN',
            },
            scheduledEvents: [
              { prisonerNumber: 'A1234BC', summary: 'Activity for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Appointments for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Court hearing for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Visit for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'External transfer for A1234BC' },
              { prisonerNumber: 'A1234BC', summary: 'Adjudication for A1234BC' },
            ],
          },
        ],
        isCtaAcceptAndSave: false,
      })
    })

    it('use appointment set appointments prisoner for type = SET', async () => {
      req.session.appointmentJourney.type = AppointmentType.SET
      req.session.appointmentSetJourney.appointments = [
        {
          startTime: {
            hour: 9,
            minute: 30,
          },
          endTime: {
            hour: 11,
            minute: 0,
          },
          prisoner: {
            number: 'B2345CD',
            name: 'TEST02 PRISONER02',
            cellLocation: '2-2-2',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        },
      ]

      await handler.GET(req, res)

      expect(activitiesService.getScheduledEventsForPrisoners).toHaveBeenCalledWith(
        tomorrow,
        ['B2345CD'],
        res.locals.user,
      )

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        prisonerSchedules: [
          {
            prisoner: {
              number: 'B2345CD',
              name: 'TEST02 PRISONER02',
              cellLocation: '2-2-2',
              prisonCode: 'MDI',
              status: 'ACTIVE IN',
            },
            startTime: {
              hour: 9,
              minute: 30,
            },
            endTime: {
              hour: 11,
              minute: 0,
            },
            scheduledEvents: [
              { prisonerNumber: 'B2345CD', summary: 'Activity for B2345CD' },
              { prisonerNumber: 'B2345CD', summary: 'Appointments for B2345CD' },
              { prisonerNumber: 'B2345CD', summary: 'Court hearing for B2345CD' },
              { prisonerNumber: 'B2345CD', summary: 'Visit for B2345CD' },
              { prisonerNumber: 'B2345CD', summary: 'External transfer for B2345CD' },
              { prisonerNumber: 'B2345CD', summary: 'Adjudication for B2345CD' },
            ],
          },
        ],
        isCtaAcceptAndSave: false,
      })
    })

    it('should not display current appointment as a clash', async () => {
      req.params.appointmentId = '1'
      req.session.appointmentJourney.type = AppointmentType.GROUP
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

      const prisoner = {
        number: 'A1234BC',
        name: 'TEST01 PRISONER01',
        cellLocation: '1-1-1',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
      }
      req.session.appointmentJourney.prisoners = [prisoner]

      const appointmentEvent1 = { appointmentId: 1, prisonerNumber: prisoner.number }
      const appointmentEvent2 = { appointmentId: 2, prisonerNumber: prisoner.number }
      const appointmentEvents = {
        activities: [],
        appointments: [appointmentEvent1, appointmentEvent2],
        courtHearings: [],
        visits: [],
        externalTransfers: [],
        adjudications: [],
      } as PrisonerScheduledEvents

      when(activitiesService.getScheduledEventsForPrisoners).mockResolvedValue(appointmentEvents)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/create-and-edit/schedule',
        expect.objectContaining({
          prisonerSchedules: [
            {
              prisoner,
              scheduledEvents: [appointmentEvent2],
            },
          ],
        }),
      )
    })

    it('should query the room schedule for video link appointments', async () => {
      req.params.appointmentId = '1'
      req.session.appointmentJourney.repeat = YesNo.NO
      req.session.appointmentJourney.category = { code: 'VLLA', description: 'Video Link - Legal Appointment' }
      req.session.appointmentJourney.location = { id: 1, description: 'Video Room' }

      activitiesService.getInternalLocationEvents.mockResolvedValue([
        {
          description: 'Video Room',
          events: [
            {
              scheduledInstanceId: 1,
              appointmentId: 1,
              prisonerNumber: 'ABC123',
              summary: 'Clashing appointment 1',
            },
            {
              scheduledInstanceId: 1,
              appointmentId: 1,
              prisonerNumber: 'ZXY321',
              summary: 'Clashing appointment 1',
            },
            {
              scheduledInstanceId: 2,
              appointmentId: 2,
              prisonerNumber: 'ZXY321',
              summary: 'Clashing appointment 2',
            },
          ],
        },
      ] as InternalLocationEvents[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/schedule', {
        isCtaAcceptAndSave: false,
        prisonerSchedules: [],
        locationSchedule: {
          description: 'Video Room',
          events: [
            {
              scheduledInstanceId: 1,
              appointmentId: 1,
              prisonerNumber: 'ABC123',
              summary: 'Clashing appointment 1',
            },
            {
              scheduledInstanceId: 2,
              appointmentId: 2,
              prisonerNumber: 'ZXY321',
              summary: 'Clashing appointment 2',
            },
          ],
        },
        appointmentId: '1',
      })
    })
  })

  describe('EDIT', () => {
    it('should call redirect and edit with date-and-time property', async () => {
      await handler.EDIT(req, res)
      expect(editAppointmentService.redirectOrEdit(req, res, 'date-and-time'))
    })

    it('should call redirect and edit with prisoners/add property', async () => {
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
      ]
      await handler.EDIT(req, res)
      expect(editAppointmentService.redirectOrEdit(req, res, 'prisoners/add'))
    })
  })

  describe('POST', () => {
    describe.each([
      {
        createJourneyComplete: true,
        redirectMethod: 'redirectOrReturn',
        description: 'When create journey is complete',
      },
      { createJourneyComplete: false, redirectMethod: 'redirect', description: "When create journey isn't complete" },
      { createJourneyComplete: undefined, redirectMethod: 'redirect', description: 'When not a create journey' },
    ])('$description', ({ createJourneyComplete, redirectMethod }) => {
      beforeEach(() => {
        req.session.appointmentJourney.createJourneyComplete = createJourneyComplete
      })

      it('should redirect to extra information page for type = GROUP', async () => {
        req.session.appointmentJourney.type = AppointmentType.GROUP
        await handler.POST(req, res)
        expect(res[redirectMethod]).toHaveBeenCalledWith('extra-information')
      })

      it('should redirect to appointment set extra information page for type = SET', async () => {
        req.session.appointmentJourney.type = AppointmentType.SET
        await handler.POST(req, res)
        expect(res[redirectMethod]).toHaveBeenCalledWith('appointment-set-extra-information')
      })

      it('should redirect to check answers page for mode = COPY', async () => {
        req.session.appointmentJourney.mode = AppointmentJourneyMode.COPY
        await handler.POST(req, res)
        expect(res[redirectMethod]).toHaveBeenCalledWith('check-answers')
      })
    })
  })

  describe('REMOVE', () => {
    it('should remove prisoner and redirect back to GET', async () => {
      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
      ]

      req.params = {
        prisonNumber: 'B2345CD',
      }

      await handler.REMOVE(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
          req.session.appointmentJourney.mode,
          'remove-prisoner',
          res.locals.user,
        ),
      )

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../../schedule')
    })

    it('should remove prisoners when editing appointment and redirect back to GET', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.session.editAppointmentJourney.addPrisoners = [
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
        {
          number: 'B2345CD',
          name: 'TEST02 PRISONER02',
          cellLocation: '2-2-2',
          status: 'ACTIVE IN',
          prisonCode: 'MDI',
        },
      ]
      req.params.prisonNumber = 'B2345CD'

      await handler.REMOVE(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
          req.session.appointmentJourney.mode,
          'remove-prisoner',
          res.locals.user,
        ),
      )

      expect(req.session.editAppointmentJourney.addPrisoners.length).toEqual(1)
      expect(req.session.editAppointmentJourney.addPrisoners).toEqual([
        {
          number: 'A1234BC',
          name: 'TEST01 PRISONER01',
          cellLocation: '1-1-1',
          prisonCode: 'MDI',
          status: 'ACTIVE IN',
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../../schedule')
    })

    it('should remove prisoner appointment from appointment set and redirect back to GET', async () => {
      req.session.appointmentJourney.type = AppointmentType.SET
      req.session.appointmentSetJourney.appointments = [
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
            status: 'ACTIVE IN',
            prisonCode: 'MDI',
          },
        },
      ]

      req.params = {
        prisonNumber: 'B2345CD',
      }

      await handler.REMOVE(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
          req.session.appointmentJourney.mode,
          'remove-prisoner',
          res.locals.user,
        ),
      )

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
            prisonCode: 'MDI',
            status: 'ACTIVE IN',
          },
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('../../schedule')
    })

    it('should redirect back to GET with preserve history', async () => {
      req.session.appointmentJourney.prisoners = []
      req.query = { preserveHistory: 'true' }
      req.params = {
        prisonNumber: 'B2345CD',
      }
      await handler.REMOVE(req, res)
      expect(res.redirect).toHaveBeenCalledWith('../../schedule?preserveHistory=true')
    })
  })
  describe('CHANGE', () => {
    it('should redirect to the correct url', async () => {
      req.query = {
        property: 'date-and-time',
        preserveHistory: 'true',
      }

      await handler.CHANGE(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
          req.session.appointmentJourney.mode,
          'date-and-time',
          res.locals.user,
        ),
      )

      expect(res.redirect).toHaveBeenCalledWith('../date-and-time?preserveHistory=true')
    })
  })
})
