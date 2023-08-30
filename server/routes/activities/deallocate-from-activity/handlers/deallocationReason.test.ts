import { Request, Response } from 'express'
import { when } from 'jest-when'
import DeallocationReasonRoutes from './deallocationReason'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Deallocation reason', () => {
  const handler = new DeallocationReasonRoutes(activitiesService)

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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        deallocateJourney: {},
      },
    } as unknown as Request

    mockActivitiesData()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/deallocate-from-activity/deallocation-reason', {
        deallocationReasons: [{ code: 'OTHER', description: 'OTHER' }],
      })
    })
  })

  describe('POST', () => {
    it('redirect with the expected params for when a deallocation reason is chosen', async () => {
      req.body = {
        deallocationReason: 'OTHER',
        deallocateJourney: {
          deallocationReason: 'OTHER',
        },
      }

      await handler.POST(req, res)
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`check-answers`)
    })
  })
})
