import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ChooseEndDateOptionRoutes, { ChooseEndDateOption } from './chooseEndDateOption'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('Route Handlers - Allocation - Choose End Date option', () => {
  const handler = new ChooseEndDateOptionRoutes()
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
      params: {
        allocationId: 1,
      },
      journeyData: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
          activity: {
            scheduleId: 2,
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/choose-end-date-option')
    })
  })

  describe('POST', () => {
    it('should redirect to remove end date page when selecting remove', async () => {
      req.body.chooseEndDateOption = 'remove'

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('remove-end-date-option')
    })

    it('should redirect to deallocate option page when selecting change end date', async () => {
      req.body.chooseEndDateOption = 'change'

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '/activities/allocations/edit/1/deallocate-today-option?allocationIds=1&scheduleId=2',
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        chooseEndDateOption: '',
      }

      const requestObject = plainToInstance(ChooseEndDateOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'chooseEndDateOption', error: 'Select if you want to change the date or remove it' },
      ])
    })
  })
})
