import { Request, Response } from 'express'
import { when } from 'jest-when'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import ReviewPrisonersAlertsRoutes from './reviewPrisonersAlerts'
import AlertsService, { PrisonerAlertResults } from '../../../../services/alertsService'

jest.mock('../../../../services/alertsService')

const alertsService = new AlertsService(null) as jest.Mocked<AlertsService>

describe('Route Handlers - Create Appointment - Review Prisoners Alerts', () => {
  const handler = new ReviewPrisonersAlertsRoutes(alertsService)

  let req: Request
  let res: Response
  const appointmentId = 1
  const preserveHistory = false

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
      params: {
        appointmentId,
      },
      query: {
        preserveHistory,
      },
    } as unknown as Request
  })

  describe('GET', () => {
    const alertsDetails = {} as PrisonerAlertResults

    beforeEach(() => {
      when(alertsService.getAlertDetails)
        .calledWith(req.session.appointmentJourney.prisoners, res.locals.user)
        .mockReturnValue(Promise.resolve(alertsDetails))
    })

    it('should render the view for create appointment', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        appointmentId,
        backLinkHref: 'how-to-add-prisoners',
        preserveHistory,
        alertsDetails,
      })
    })

    it('should render the view for create appointment set', async () => {
      req.session.appointmentJourney.type = AppointmentType.SET

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        appointmentId,
        backLinkHref: 'upload-appointment-set',
        preserveHistory,
        alertsDetails,
      })
    })

    it('should render the view for edit appointment', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        appointmentId,
        backLinkHref: 'how-to-add-prisoners',
        preserveHistory,
        alertsDetails,
      })
    })

    it('should render the view with back to prisoner profile', async () => {
      req.session.appointmentJourney.fromPrisonNumberProfile = 'A1234BC'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        appointmentId,
        backLinkHref: 'https://digital-dev.prison.service.justice.gov.uk/prisoner/A1234BC',
        preserveHistory,
        alertsDetails,
      })
    })

    it('should render the review prisoners alerts view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        appointmentId,
        backLinkHref: 'how-to-add-prisoners',
        preserveHistory: 'true',
        alertsDetails,
      })
    })
  })

  describe('POST', () => {
    it('should redirect or return to non-associations page during create', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.CREATE
      req.body = {
        howToAdd: 'SEARCH',
      }
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('review-non-associations')
    })

    it('should redirect or return to name page during copy', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.COPY
      req.body = {
        howToAdd: 'SEARCH',
      }
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
    it('should redirect to the non-assocaitions page', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      await handler.EDIT(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('review-non-associations')
    })
  })

  describe('REMOVE', () => {
    it('should remove review prisoner alerts and redirect back to GET', async () => {
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
      expect(res.redirect).toBeCalledWith('../../review-prisoners-alerts')
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
      expect(res.redirect).toBeCalledWith('../../review-prisoners-alerts')
    })

    it('should redirect back to GET with preserve history', async () => {
      req.session.appointmentJourney.prisoners = []
      req.query = { preserveHistory: 'true' }
      req.params = {
        prisonNumber: 'B2345CD',
      }
      await handler.REMOVE(req, res)
      expect(res.redirect).toBeCalledWith('../../review-prisoners-alerts?preserveHistory=true')
    })
  })
})
