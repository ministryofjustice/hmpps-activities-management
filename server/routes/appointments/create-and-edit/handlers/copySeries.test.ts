import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Request, Response } from 'express'
import CopySeries, { HowToCopySeriesOptions, HowToCopySeriesForm } from './copySeries'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { YesNo } from '../../../../@types/activities'

describe('Route Handlers - Duplicate Appointment - Copy Appointment Series', () => {
  const handler = new CopySeries()
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
        appointmentJourney: {},
      },
      query: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/copy-series', {
        appointmentJourney: req.session.appointmentJourney,
        HowToCopySeriesOptions,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to schedule page when user wants to duplicate the full series', async () => {
      req.body = {
        howToCopy: 'SERIES',
      }

      await handler.POST(req, res)

      expect(res.redirect).toBeCalledWith('schedule')
      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
    })

    it('should redirect to schedule page when user wants to duplicate a dingle appointment', async () => {
      req.body = {
        howToCopy: 'ONE_OFF',
      }

      await handler.POST(req, res)

      expect(res.redirect).toBeCalledWith('schedule')
      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.NO)
    })
  })

  describe('Validation', () => {
    it.each([{ howToCopy: 'SERIES' }, { howToCopy: 'ONE_OFF' }])(
      'should pass validation on a valid selection when howToCopy = $howToCopy',
      async ({ howToCopy }) => {
        const body = {
          howToCopy,
        }

        const requestObject = plainToInstance(HowToCopySeriesForm, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([])
      },
    )

    it('should fail validation on invalid selection', async () => {
      const body = {
        howToAdd: 'INVALID',
      }

      const requestObject = plainToInstance(HowToCopySeriesForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'You must select one option', property: 'howToCopy' }]))
    })
  })
})
