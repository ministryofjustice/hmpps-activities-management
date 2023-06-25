import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckDeallocationRoutes from './checkDeallocation'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Check deallocation', () => {
  const handler = new CheckDeallocationRoutes(activitiesService)

  let req: Request
  let res: Response

  const mockActivitiesData = () => {
    when(activitiesService.getDeallocationReasons).mockResolvedValue([{ code: 'OTHER', description: 'OTHER' }])
  }

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        deallocateJourney: {
          deallocationDate: { day: 5, month: 6, year: 2023 } as SimpleDate,
          deallocationReason: 'OTHER',
        },
      },
    } as unknown as Request

    mockActivitiesData()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/deallocate-from-activity/check-answers', {
        deallocationDate: '2023-06-05',
        deallocationReason: 'OTHER',
      })
    })
  })

  describe('POST', () => {
    it('redirect with the expected params when deallocated from activity', async () => {
      req.body = {
        deallocationReason: 'OTHER',
        deallocateJourney: {
          deallocationReason: 'OTHER',
        },
      }

      await handler.POST(req, res)

      expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
        {
          deallocationDate: {
            day: 5,
            month: 6,
            year: 2023,
          },
          deallocationReason: 'OTHER',
        },
        {},
      )
      expect(res.redirect).toHaveBeenCalledWith(`confirmation`)
    })
  })
})
