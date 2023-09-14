import { Request, Response } from 'express'
import { when } from 'jest-when'
import DeallocationReasonRoutes from './deallocationReason'
import ActivitiesService from '../../../../services/activitiesService'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { allocationId: 1 },
      session: {
        allocateJourney: {
          endDate: simpleDateFromDate(new Date()),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            activityId: 1,
            scheduleId: 1,
          },
        },
      },
    } as unknown as Request

    mockActivitiesData()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/deallocation-reason', {
        deallocationReasons: [{ code: 'OTHER', description: 'OTHER' }],
        allocationId: 1,
      })
    })
  })

  describe('POST', () => {
    it('redirect with the expected params for when a deallocation reason is chosen', async () => {
      req.body = {
        deallocationReason: 'OTHER',
      }

      await handler.POST(req, res)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/allocation-dashboard/1/check-allocation/ABC123`,
        'Allocation updated',
        "We've updated the reason for ending this allocation",
      )
    })
  })
})
