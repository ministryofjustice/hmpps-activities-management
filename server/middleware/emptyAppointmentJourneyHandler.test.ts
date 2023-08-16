import { Request, Response } from 'express'
import emptyAppointmentJourneyHandler from './emptyAppointmentJourneyHandler'
import { AppointmentJourneyMode, AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'

describe('emptyAppointmentJourneyHandler', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  beforeEach(() => {
    req = {
      session: {},
    } as Request

    res = {
      redirect: jest.fn(),
    } as unknown as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('step requires an active appointment journey in session', () => {
    const middleware = emptyAppointmentJourneyHandler(true)

    it('should redirect back to appointments submenu when the journey data is not in session', async () => {
      req.session.appointmentJourney = null
      await middleware(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/appointments')
    })

    it('should continue if journey data exists in session', async () => {
      req.session.appointmentJourney = { mode: AppointmentJourneyMode.CREATE, type: AppointmentType.INDIVIDUAL }
      await middleware(req, res, next)

      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('step does not require an active appointment journey in session', () => {
    const middleware = emptyAppointmentJourneyHandler(false)

    it('should continue when the journey data is not in session', async () => {
      req.session.appointmentJourney = null
      await middleware(req, res, next)

      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })
})
