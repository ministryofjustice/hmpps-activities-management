import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SelectDateRoutes, { SelectDate } from './select-date'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { ServiceUser } from '../../../../@types/express'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

jest.mock('../../../../services/activitiesService')

describe('Route Handlers - Appointments Management - Search Select date', () => {
  const handler = new SelectDateRoutes()
  const user = { activeCaseLoadId: 'MDI', username: 'USER1', firstName: 'John', lastName: 'Smith' } as ServiceUser
  let req: Request
  let res: Response

  beforeEach(() => {
    req = {} as unknown as Request

    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render select date page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/search/select-date')
    })
  })

  describe('POST', () => {
    it('should redirect with correct date', async () => {
      req.body = {
        startDate: simpleDateFromDate(new Date('2021-10-05')),
      }

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/appointments/search?startDate=2021-10-05')
    })
  })

  describe('Validation', () => {
    it('validation fails when no date is specified', async () => {
      const body = {}

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a valid date', property: 'startDate' }]))
    })

    it('validation fails when invalid date is entered', async () => {
      const body = {
        startDate: {
          day: '40',
          month: '10',
          year: '2021',
        },
      }

      const requestObject = plainToInstance(SelectDate, body)
      const errors = await validate(requestObject).then(errs =>
        errs.flatMap(e => e.children.flatMap(associateErrorsWithProperty)),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Enter a valid day', property: 'day' }]))
    })
  })
})
