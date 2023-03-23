import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import BankHolidayOptionRoutes, { BankHolidayOption } from './bankHoliday'
import { associateErrorsWithProperty } from '../../../utils/utils'

describe('Route Handlers - Create an activity schedule - Bank Holiday option', () => {
  const handler = new BankHolidayOptionRoutes()
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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/bank-holiday-option')
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to location page', async () => {
      req.body = {
        runsOnBankHoliday: 'yes',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.runsOnBankHoliday).toEqual(true)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        runsOnBankHoliday: '',
      }

      const requestObject = plainToInstance(BankHolidayOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'runsOnBankHoliday', error: 'Choose whether you want the schedule to run on a bank holiday.' },
      ])
    })
  })
})
