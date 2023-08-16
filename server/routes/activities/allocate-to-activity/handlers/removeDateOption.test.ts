import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import RemoveDateOptionRoutes from './removeDateOption'
import { EndDateOption } from '../../allocation-dashboard/handlers/endDateOption'

describe('Route Handlers - Allocation - Remove Date option', () => {
  const handler = new RemoveDateOptionRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'user',
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocate-to-activity/remove-date-option', {
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

      expect(res.redirect).toHaveBeenCalledWith('end-date?preserveHistory=true')
    })

    describe('type validation', () => {
      it('validation fails if a value is not entered', async () => {
        const body = {
          endDateOption: '',
        }

        const requestObject = plainToInstance(EndDateOption, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual([
          { property: 'endDateOption', error: 'Choose whether you want to change or remove the end date.' },
        ])
      })
    })
  })
})
