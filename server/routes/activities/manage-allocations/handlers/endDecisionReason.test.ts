import { Request, Response } from 'express'
import { startOfToday } from 'date-fns'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import EndDecisionRoutes from './endDecisionReason'
import { EndDecision } from '../journey'

describe('Route Handlers - Edit allocation - End decision reason', () => {
  const handler = new EndDecisionRoutes()
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
      params: { mode: 'remove' },
      session: {
        allocateJourney: {
          activity: {
            name: 'Maths Level 1',
          },
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
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/end-decision')
    })
  })

  describe('POST', () => {
    it('should redirect to the reason page when the end decision on BEFORE_START', async () => {
      req.body = { endDecision: EndDecision.BEFORE_START }
      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(startOfToday()))
      expect(res.redirect).toHaveBeenCalledWith('reason')
    })

    it('should redirect to the end-date page when the end decision on AFTER_START', async () => {
      req.body = { endDecision: EndDecision.AFTER_START }
      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(undefined)
      expect(res.redirect).toHaveBeenCalledWith('end-date')
    })
  })
})
