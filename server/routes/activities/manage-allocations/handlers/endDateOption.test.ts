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
      body: {},
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
          activity: {},
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-date-option')
    })
  })

  describe('POST', () => {
    it('should redirect to end date page when selecting yes', async () => {
      req.body.endDateOption = 'yes'

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date')
    })

    it('should redirect to pay band page when selecting no and activity is paid', async () => {
      req.body.endDateOption = 'no'
      req.session.allocateJourney.activity.paid = true

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('pay-band')
    })

    it('should redirect to exclusions page when selecting no and activity is unpaid (single allocation mode)', async () => {
      req.body.endDateOption = 'no'
      req.session.allocateJourney.activity.paid = false
      req.session.allocateJourney.allocateMultipleInmatesMode = false

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('exclusions')
    })

    it('should redirect to exclusions page when selecting no and activity is unpaid (multiple allocation mode)', async () => {
      req.body.endDateOption = 'no'
      req.session.allocateJourney.activity.paid = false
      req.session.allocateJourney.allocateMultipleInmatesMode = true

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('multiple/pay-band-multiple')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        endDateOption: '',
      }

      const requestObject = plainToInstance(EndDateOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'endDateOption', error: 'Select if you want to enter an end date or not' }])
    })
  })
})
