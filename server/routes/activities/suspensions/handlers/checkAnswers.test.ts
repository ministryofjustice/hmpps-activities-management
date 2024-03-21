import { Request, Response } from 'express'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Suspensions - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
  let req: Request
  let res: Response

  const user = {
    username: 'test.user',
    activeCaseLoadId: 'TPR',
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      body: {},
      params: {},
      query: {},
      session: {
        suspendJourney: {
          allocations: [
            {
              activityName: 'Activity 1',
              allocationId: 1,
            },
            {
              activityName: 'Activity 2',
              allocationId: 2,
            },
          ],
          earliestAllocationEndDate: '2024-06-02',
          earliestAllocationStartDate: '2024-03-02',
          inmate: {
            prisonerName: 'John Smith',
            prisonerNumber: 'ABC123',
          },
          suspendFrom: '2024-05-23',
          suspendUntil: '2024-05-25',
          caseNote: {
            type: 'GEN',
            text: 'case note text',
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the correct view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/check-answers')
    })
  })

  describe('POST', () => {
    it('suspend mode should post the allocation amendments and redirect', async () => {
      req.params.mode = 'suspend'

      await handler.POST(req, res)

      const expectedBody = {
        suspendFrom: '2024-05-23',
        suspensionCaseNote: {
          type: 'GEN',
          text: 'case note text',
        },
      }

      expect(activitiesService.updateAllocation).toHaveBeenCalledTimes(2)
      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(1, expectedBody, user)
      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(2, expectedBody, user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })

    it('unsuspend mode should post the allocation amendments and redirect', async () => {
      req.params.mode = 'unsuspend'

      await handler.POST(req, res)

      const expectedBody = { suspendUntil: '2024-05-25' }

      expect(activitiesService.updateAllocation).toHaveBeenCalledTimes(2)
      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(1, expectedBody, user)
      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(2, expectedBody, user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
  })
})
