import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import DeallocationDateRoutes from './deallocationDate'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

describe('Route Handlers - Deallocation date', () => {
  const handler = new DeallocationDateRoutes()

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        deallocateJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/deallocate-from-activity/deallocation-date')
    })
  })

  describe('POST', () => {
    it('redirect with the expected params for when a deallocation date is entered', async () => {
      const tomorrow = addDays(startOfToday(), 1)
      req.body = {
        deallocationDate: tomorrow,
        deallocateJourney: {
          deallocationDate: '2023-06-05',
        },
      }

      await handler.POST(req, res)
      expect(req.session.deallocateJourney.deallocationDate).toEqual(formatIsoDate(tomorrow))
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`reason`)
    })
  })
})
