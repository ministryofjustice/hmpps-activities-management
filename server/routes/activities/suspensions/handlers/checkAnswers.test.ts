import { Request, Response } from 'express'
import CheckAnswersRoutes from './checkAnswers'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonerSuspensionStatus } from '../../manage-allocations/journey'
import { YesNo } from '../../../../@types/activities'

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
      params: { prisonerNumber: 'ABC123' },
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
          inmate: {
            prisonerName: 'John Smith',
            prisonerNumber: 'ABC123',
          },
          suspendFrom: '2024-05-23',
          suspendUntil: '2024-05-25',
          paid: YesNo.YES,
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
    it('suspend mode should post the allocation amendments (SUSPENDED_WITH_PAY) and redirect', async () => {
      req.routeContext = { mode: 'suspend' }

      await handler.POST(req, res)

      const expectedCaseNote = {
        type: 'GEN',
        text: 'case note text',
      }

      expect(activitiesService.suspendAllocations).toHaveBeenCalled()
      expect(activitiesService.suspendAllocations).toHaveBeenCalledWith(
        'ABC123',
        [1, 2],
        '2024-05-23',
        PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
        expectedCaseNote,
        user,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
    it('suspend mode should post the allocation amendments (SUSPENDED and redirect', async () => {
      req.routeContext = { mode: 'suspend' }

      req.session.suspendJourney.paid = YesNo.NO

      await handler.POST(req, res)

      const expectedCaseNote = {
        type: 'GEN',
        text: 'case note text',
      }

      expect(activitiesService.suspendAllocations).toHaveBeenCalled()
      expect(activitiesService.suspendAllocations).toHaveBeenCalledWith(
        'ABC123',
        [1, 2],
        '2024-05-23',
        PrisonerSuspensionStatus.SUSPENDED,
        expectedCaseNote,
        user,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })

    it('unsuspend mode should post the allocation amendments and redirect', async () => {
      req.routeContext = { mode: 'unsuspend' }

      await handler.POST(req, res)

      expect(activitiesService.unsuspendAllocations).toHaveBeenCalled()
      expect(activitiesService.unsuspendAllocations).toHaveBeenCalledWith('ABC123', [1, 2], '2024-05-25', user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
  })
})
