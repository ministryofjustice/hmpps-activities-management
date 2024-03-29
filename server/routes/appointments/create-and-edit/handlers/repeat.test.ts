import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RepeatRoutes, { Repeat } from './repeat'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentFrequency } from '../../../../@types/appointments'

describe('Route Handlers - Create Appointment - Repeat', () => {
  const handler = new RepeatRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      session: {
        appointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the repeat view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/repeat')
    })
  })

  describe('POST', () => {
    it('should save repeat = NO in session and redirect to schedule page', async () => {
      req.body = {
        repeat: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.NO)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule')
    })

    it('should save repeat = YES in session and redirect to repeat frequency and count page', async () => {
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
      expect(res.redirect).toHaveBeenCalledWith('repeat-frequency-and-count')
    })

    it('should not save repeat = YES in session if previously was NO and redirect to repeat frequency and count page', async () => {
      req.session.appointmentJourney.repeat = YesNo.NO
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.NO)
      expect(res.redirect).toHaveBeenCalledWith('repeat-frequency-and-count')
    })

    it('should redirect to repeat frequency and count page page when repeat = YES has not changed but repeat frequency is not set', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES
      req.session.appointmentJourney.frequency = undefined
      req.session.appointmentJourney.numberOfAppointments = 6
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
      expect(res.redirect).toHaveBeenCalledWith('repeat-frequency-and-count')
    })

    it('should redirect to repeat frequency and count page page when repeat = YES has not changed but repeat count is not set', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES
      req.session.appointmentJourney.frequency = AppointmentFrequency.FORTNIGHTLY
      req.session.appointmentJourney.numberOfAppointments = undefined
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
      expect(res.redirect).toHaveBeenCalledWith('repeat-frequency-and-count')
    })

    it('should redirect to schedule page when repeat = YES has not changed and repeat frequency and count are set', async () => {
      req.session.appointmentJourney.repeat = YesNo.YES
      req.session.appointmentJourney.frequency = AppointmentFrequency.DAILY
      req.session.appointmentJourney.numberOfAppointments = 7
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule')
    })
  })

  describe('Validation', () => {
    it('validation fails when no repeat value is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Repeat, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an option', property: 'repeat' }]))
    })

    it('validation fails when invalid repeat value is selected', async () => {
      const body = {
        repeat: 'MAYBE',
      }

      const requestObject = plainToInstance(Repeat, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an option', property: 'repeat' }]))
    })

    it('passes validation when valid repeat value is selected', async () => {
      const body = {
        repeat: YesNo.YES,
      }

      const requestObject = plainToInstance(Repeat, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
