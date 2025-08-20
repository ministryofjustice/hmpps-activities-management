import { Request, Response } from 'express'
import { addDays, subDays } from 'date-fns'
import SelectDateRoutes from './selectDate'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import DateOption from '../../../../enum/dateOption'

describe('Route Handlers - Select Date', () => {
  const handler = new SelectDateRoutes()

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
    } as unknown as Response

    req = {
      date: new Date().toISOString(),
      dateOption: 'today',
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render select date', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance-summary-stats/select-date')
    })
  })

  describe('POST', () => {
    it('should redirect with today', async () => {
      req = {
        body: {
          dateOption: DateOption.TODAY,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(new Date())}`)
    })

    it('should redirect with yesterday', async () => {
      req = {
        body: {
          dateOption: DateOption.YESTERDAY,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(subDays(new Date(), 1))}`)
    })

    it('should redirect with tomorrow', async () => {
      req = {
        body: {
          dateOption: DateOption.TOMORROW,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(addDays(new Date(), 1))}`)
    })

    it('should redirect with the other date option', async () => {
      req = {
        body: {
          date: new Date(),
          dateOption: DateOption.OTHER,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`dashboard?date=${formatIsoDate(new Date())}`)
    })
  })
})
