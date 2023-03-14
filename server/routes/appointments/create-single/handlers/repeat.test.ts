import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RepeatRoutes, { Repeat } from './repeat'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Individual Appointment - Repeat', () => {
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
      session: {
        createSingleAppointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the repeat view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/repeat')
    })
  })

  describe('POST', () => {
    it('should save repeat = NO in session and redirect to check answers page', async () => {
      req.body = {
        repeat: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.repeat).toEqual(YesNo.NO)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })

    it('should save repeat = YES in session and redirect to repeat period and count page', async () => {
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.repeat).toEqual(YesNo.YES)
      expect(res.redirect).toHaveBeenCalledWith('repeat-period-and-count')
    })

    it('should not save repeat = YES in session if previously was NO and redirect to repeat period and count page', async () => {
      req.session.createSingleAppointmentJourney.repeat = YesNo.NO
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.repeat).toEqual(YesNo.NO)
      expect(res.redirect).toHaveBeenCalledWith('repeat-period-and-count')
    })

    it('should redirect to check answers page when repeat = YES has not changed', async () => {
      req.session.createSingleAppointmentJourney.repeat = YesNo.YES
      req.body = {
        repeat: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.repeat).toEqual(YesNo.YES)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('Validation', () => {
    it('validation fails when no repeat value is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Repeat, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select yes if the appointment will repeat', property: 'repeat' }]),
      )
    })

    it('validation fails when invalid repeat value is selected', async () => {
      const body = {
        repeat: 'MAYBE',
      }

      const requestObject = plainToInstance(Repeat, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select yes if the appointment will repeat', property: 'repeat' }]),
      )
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
