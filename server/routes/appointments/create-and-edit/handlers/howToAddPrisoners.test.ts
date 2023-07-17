import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Request, Response } from 'express'
import HowToAddPrisoners, { HowToAddOptions, HowToAddPrisonersForm } from './howToAddPrisoners'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Create Appointment - How to add prisoners', () => {
  const handler = new HowToAddPrisoners()
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
    it('should render the how to add prisoners view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/how-to-add-prisoners', {
        backLinkHref: '/appointments',
        HowToAddOptions,
      })
    })

    it('should render the how to add prisoners view with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/how-to-add-prisoners', {
        backLinkHref: '/appointments',
        preserveHistory: 'true',
        HowToAddOptions,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to select prisoner page', async () => {
      req.body = {
        howToAdd: 'SEARCH',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('select-prisoner')
    })

    it('should redirect to select prisoner page with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      req.body = {
        howToAdd: 'SEARCH',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('select-prisoner?preserveHistory=true')
    })

    it('should redirect to upload by CSV page', async () => {
      req.body = {
        howToAdd: 'CSV',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('upload-prisoner-list')
    })

    it('should redirect to upload by CSV page with preserve history', async () => {
      req.query = { preserveHistory: 'true' }
      req.body = {
        howToAdd: 'CSV',
      }
      await handler.POST(req, res)
      expect(res.redirect).toBeCalledWith('upload-prisoner-list?preserveHistory=true')
    })
  })

  describe('Validation', () => {
    it('should pass validation on a valid selection', async () => {
      const body = {
        howToAdd: 'SEARCH',
      }

      const requestObject = plainToInstance(HowToAddPrisonersForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([])
    })

    it('should fail validation on invalid selection', async () => {
      const body = {
        howToAdd: 'INVALID',
      }

      const requestObject = plainToInstance(HowToAddPrisonersForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'You must select one option', property: 'howToAdd' }]))
    })
  })
})
