import { Request, Response } from 'express'
import { when } from 'jest-when'
import ReviewPrisoners from './reviewPrisoners'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import PrisonerAlertsService, { PrisonerAlertResults } from '../../../../services/prisonerAlertsService'
import { AppointmentPrisonerDetails } from '../appointmentPrisonerDetails'

jest.mock('../../../../services/metricsService')
jest.mock('../../../../services/prisonerAlertsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>
const prisonerAlertsService = new PrisonerAlertsService(null) as jest.Mocked<PrisonerAlertsService>

describe('Route Handlers - Create Appointment - Review Prisoners', () => {
  const handler = new ReviewPrisoners(metricsService, prisonerAlertsService)
  let req: Request
  let res: Response
  const appointmentId = '2'

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {
        user: {
          username: 'user',
          activeCaseLoadId: 'LEI',
        },
      },
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          prisoners: [],
        },
        editAppointmentJourney: {
          addPrisoners: [],
        },
        appointmentSetJourney: {
          appointments: [],
        },
      },
      params: {},
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    const prisoners = [
      {
        number: 'A1234BC',
        name: '',
        cellLocation: '',
        status: '',
        prisonCode: '',
      },
      {
        number: 'B2345CD',
        name: '',
        cellLocation: '',
        status: '',
        prisonCode: '',
      },
    ]

    it('should render the review prisoners view with back to how to add prisoners during CREATE', async () => {
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        backLinkHref: 'how-to-add-prisoners',
        prisoners,
      })
    })

    it('should render the review prisoners view with back to how to add prisoners during COPY', async () => {
      req.session.appointmentJourney.prisoners = prisoners
      req.session.appointmentJourney.originalAppointmentId = 1234
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        backLinkHref: 'how-to-add-prisoners',
        prisoners,
        originalAppointmentId: 1234,
      })
    })

    it('should render the review prisoners view with back to upload appointment set', async () => {
      req.session.appointmentJourney.type = AppointmentType.SET
      req.session.appointmentSetJourney.appointments = [
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
            status: '',
            prisonCode: '',
          },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
            status: '',
            prisonCode: '',
          },
        },
      ]
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        backLinkHref: 'upload-appointment-set',
        prisoners: [
          {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
            prisonCode: '',
            status: '',
          },
          {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
            prisonCode: '',
            status: '',
          },
        ],
      })
    })

    it('should render the review prisoners view with back to prisoner profile', async () => {
      req.session.appointmentJourney.fromPrisonNumberProfile = 'A1234BC'
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        backLinkHref: 'https://digital-dev.prison.service.justice.gov.uk/prisoner/A1234BC',
        prisoners: [],
      })
    })

    it('should render the review prisoners view with ids, added prisoners and back to how to add prisoners', async () => {
      req.params = {
        appointmentId,
      }
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.session.editAppointmentJourney.addPrisoners = prisoners
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.APPOINTMENT_CHANGE_FROM_SCHEDULE(
          req.session.appointmentJourney.mode,
          'attendees',
          res.locals.user,
        ),
      )
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        appointmentId,
        backLinkHref: 'how-to-add-prisoners',
        prisoners,
      })
    })

    it('should render the review prisoners view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        backLinkHref: 'how-to-add-prisoners',
        preserveHistory: 'true',
        prisoners,
      })
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      req.body = {
        howToAdd: 'SEARCH',
      }
    })

    it.each([{ mode: AppointmentJourneyMode.CREATE }, { mode: AppointmentJourneyMode.EDIT }])(
      'should redirect or return to review alerts page if there are any alerts when mode is $mode',
      async ({ mode }) => {
        req.session.appointmentJourney.mode = mode

        when(prisonerAlertsService.getAlertDetails)
          .calledWith(req.session.appointmentJourney.prisoners, res.locals.user.activeCaseLoadId, res.locals.user)
          .mockReturnValue(Promise.resolve({ numPrisonersWithAlerts: 1 } as PrisonerAlertResults))

        await handler.POST(req, res)
        expect(res.redirectOrReturn).toBeCalledWith('review-prisoners-alerts')
      },
    )

    it('should redirect or return to review alerts page there are no alerts when mode is CREATE', async () => {
      when(prisonerAlertsService.getAlertDetails)
        .calledWith(req.session.appointmentJourney.prisoners, res.locals.user.activeCaseLoadId, res.locals.user)
        .mockReturnValue(Promise.resolve({ numPrisonersWithAlerts: 0 } as PrisonerAlertResults))

      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('name')
    })

    it('should redirect or return to name page when there are no alerts when mode is COPY', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.COPY

      when(prisonerAlertsService.getAlertDetails)
        .calledWith(req.session.appointmentJourney.prisoners, res.locals.user.activeCaseLoadId, res.locals.user)
        .mockReturnValue(Promise.resolve({ numPrisonersWithAlerts: 0 } as PrisonerAlertResults))

      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('date-and-time')
    })

    it('should populate return to with schedule', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.POST(req, res)
      expect(req.session.returnTo).toEqual('schedule?preserveHistory=true')
    })
  })

  describe('EDIT', () => {
    const prisoners: AppointmentPrisonerDetails[] = [
      {
        number: 'A1234BC',
        name: '',
        cellLocation: '',
        status: '',
        prisonCode: '',
      },
      {
        number: 'B2345CD',
        name: '',
        cellLocation: '',
        status: '',
        prisonCode: '',
      },
    ]

    beforeEach(() => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.session.editAppointmentJourney.addPrisoners = prisoners
    })

    it('should redirect or return to review alerts page if there are any alerts', async () => {
      when(prisonerAlertsService.getAlertDetails)
        .calledWith(prisoners, res.locals.user.activeCaseLoadId, res.locals.user)
        .mockReturnValue(Promise.resolve({ numPrisonersWithAlerts: 1 } as PrisonerAlertResults))

      await handler.EDIT(req, res)

      expect(res.redirect).toBeCalledWith('review-prisoners-alerts')
    })

    it('should redirect to the alerts page if there are no alerts', async () => {
      when(prisonerAlertsService.getAlertDetails)
        .calledWith(prisoners, res.locals.user.activeCaseLoadId, res.locals.user)
        .mockReturnValue(Promise.resolve({ numPrisonersWithAlerts: 0 } as PrisonerAlertResults))

      await handler.EDIT(req, res)

      expect(res.redirect).toBeCalledWith('../../schedule')
    })
  })

  describe('REMOVE', () => {
    it('should remove prisoner and redirect back to GET', async () => {
      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
          status: '',
          prisonCode: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
          status: '',
          prisonCode: '',
        },
      ]

      req.params = {
        prisonNumber: 'B2345CD',
      }

      await handler.REMOVE(req, res)

      expect(req.session.appointmentJourney.prisoners).toEqual([
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
          prisonCode: '',
          status: '',
        },
      ])
      expect(res.redirect).toBeCalledWith('../../review-prisoners')
    })

    it('should remove appointment and redirect back to GET', async () => {
      req.session.appointmentJourney.type = AppointmentType.SET
      req.session.appointmentSetJourney.appointments = [
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
            status: '',
            prisonCode: '',
          },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
            status: '',
            prisonCode: '',
          },
        },
      ]

      req.params = {
        prisonNumber: 'B2345CD',
      }

      await handler.REMOVE(req, res)

      expect(req.session.appointmentSetJourney.appointments).toEqual([
        {
          prisoner: {
            number: 'A1234BC',
            name: '',
            cellLocation: '',
            prisonCode: '',
            status: '',
          },
        },
      ])
      expect(res.redirect).toBeCalledWith('../../review-prisoners')
    })

    it('should redirect back to GET with preserve history', async () => {
      req.session.appointmentJourney.prisoners = []
      req.query = { preserveHistory: 'true' }
      req.params = {
        prisonNumber: 'B2345CD',
      }
      await handler.REMOVE(req, res)
      expect(res.redirect).toBeCalledWith('../../review-prisoners?preserveHistory=true')
    })
  })
})
