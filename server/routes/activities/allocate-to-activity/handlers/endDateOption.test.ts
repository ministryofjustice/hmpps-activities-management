import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import EndDateOptionRoutes, { EndDateOption } from './endDateOption'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Allocation - End Date option', () => {
  const handler = new EndDateOptionRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocate-to-activity/end-date-option', {
        prisonerName: 'John Smith',
      })
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to change date page', async () => {
      req.body = {
        endDateOption: 'change',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay-band')
    })

    it('should save entered end date in database', async () => {
      req = {
        session: {},
        body: {
          endDateOption: 'yes',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        endDateOption: '',
      }

      const requestObject = plainToInstance(EndDateOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDateOption', error: 'Choose whether you want to set the end date.' }])
    })
  })
})
