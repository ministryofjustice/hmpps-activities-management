import { Request, Response } from 'express'
import ReviewPrisoners from './reviewPrisoners'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/MetricsEvent'

jest.mock('../../../../services/metricsService')

const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Create Appointment - Review Prisoners', () => {
  const handler = new ReviewPrisoners(metricsService)
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
    it('should render the review prisoners view with back to how to add prisoners', async () => {
      const prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
        },
      ]
      req.session.appointmentJourney.prisoners = prisoners
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        backLinkHref: 'how-to-add-prisoners',
        prisoners,
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
          },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
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
          },
          {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
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
      const prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
        },
      ]
      req.session.editAppointmentJourney.addPrisoners = prisoners
      await handler.GET(req, res)
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        new MetricsEvent('SAA-Appointment-Change-From-Schedule', res.locals.user).addProperties({
          appointmentJourneyMode: req.session.appointmentJourney.mode,
          property: 'attendees',
        }),
      )
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/review-prisoners', {
        appointmentId,
        backLinkHref: 'how-to-add-prisoners',
        prisoners,
      })
    })

    it('should render the review prisoners view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      const prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
        },
      ]
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
    it('should remove prisoner and redirect back to GET', async () => {
      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: '',
          cellLocation: '',
        },
        {
          number: 'B2345CD',
          name: '',
          cellLocation: '',
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
          },
        },
        {
          prisoner: {
            number: 'B2345CD',
            name: '',
            cellLocation: '',
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
