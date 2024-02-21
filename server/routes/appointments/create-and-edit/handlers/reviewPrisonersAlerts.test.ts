import { Request, Response } from 'express'
import { AppointmentType } from '../appointmentJourney'
import ReviewPrisonersAlertsRoutes from './reviewPrisonersAlerts'

jest.mock('../../../../services/metricsService')

describe('Route Handlers - Create Appointment - Review Prisoners Alerts', () => {
  const handler = new ReviewPrisonersAlertsRoutes()
  let req: Request
  let res: Response

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
    it('should render the review prisoners alerts view with back to how to add prisoners', async () => {
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
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        backLinkHref: 'how-to-add-prisoners',
        prisoners,
      })
    })

    it('should render the review prisoners alerts view with back to upload appointment set', async () => {
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
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
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

    it('should render the review prisoners alerts view with back to prisoner profile', async () => {
      req.session.appointmentJourney.fromPrisonNumberProfile = 'A1234BC'
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        backLinkHref: 'https://digital-dev.prison.service.justice.gov.uk/prisoner/A1234BC',
        prisoners: [],
      })
    })

    it('should render the review prisoners alerts view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
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
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners-alerts', {
        backLinkHref: 'how-to-add-prisoners',
        preserveHistory: 'true',
        prisoners,
      })
    })
  })

  describe('POST', () => {
    it('should redirect or return to name page', async () => {
      req.body = {
        howToAdd: 'SEARCH',
      }
      await handler.POST(req, res)
      expect(res.redirectOrReturn).toBeCalledWith('name')
    })

    it('should populate return to with schedule', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.POST(req, res)
      expect(req.session.returnTo).toEqual('schedule?preserveHistory=true')
    })
  })

  describe('EDIT', () => {
    it('should redirect to the schedule page', async () => {
      await handler.EDIT(req, res)
      expect(res.redirect).toBeCalledWith('../../schedule')
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
