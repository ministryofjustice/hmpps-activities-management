import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ReinstateRoutes, { ReinstateForm } from './reinstate'
import { YesNo } from '../../../../../@types/activities'

describe('Route Handlers - Waitlist application - Reinstate', () => {
  const handler = new ReinstateRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {} as unknown as Request
  })

  describe('GET', () => {
    it('should render the reinstate template', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/waitlist-application/reinstate', {})
    })
  })

  describe('POST', () => {
    it('should redirect to reinstate-reason when YES is selected', async () => {
      req.body = {
        reinstate: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('./reinstate-reason')
    })

    it('should redirect to view when NO is selected', async () => {
      req.body = {
        reinstate: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('./view')
    })
  })

  describe('type validation', () => {
    it('validation fails when no reinstate option is provided', async () => {
      const body = {}

      const requestObject = plainToInstance(ReinstateForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toContainEqual({
        property: 'reinstate',
        error: 'Select if you want to reinstate this application or not',
      })
    })

    it('validation fails when an invalid reinstate option is provided', async () => {
      const body = {
        reinstate: 'INVALID',
      }

      const requestObject = plainToInstance(ReinstateForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toContainEqual({
        property: 'reinstate',
        error: 'Select if you want to reinstate this application or not',
      })
    })

    it('validation passes when YES is provided', async () => {
      const body = {
        reinstate: YesNo.YES,
      }

      const requestObject = plainToInstance(ReinstateForm, body)
      const errors = await validate(requestObject)

      expect(errors).toHaveLength(0)
    })

    it('validation passes when NO is provided', async () => {
      const body = {
        reinstate: YesNo.NO,
      }

      const requestObject = plainToInstance(ReinstateForm, body)
      const errors = await validate(requestObject)

      expect(errors).toHaveLength(0)
    })
  })
})
