import { Request, Response } from 'express'
import { when } from 'jest-when'
import ConfirmationRoutes from './confirmation'
import ActivitiesService from '../../../../../services/activitiesService'
import atLeast from '../../../../../../jest.setup'
import { Activity, WaitingListApplication } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Waitlist - Confirmation', () => {
  const handler = new ConfirmationRoutes(activitiesService)

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
      params: {},
      journeyData: {
        waitListApplicationJourney: {
          prisoner: { name: 'Alan Key', prisonerNumber: 'ABC1234' },
          activity: { activityId: 1, scheduleId: 1 },
        },
      },
      session: {
        journeyMetrics: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          schedules: [
            {
              activity: {
                capacity: 5,
                allocated: 3,
              },
            },
          ],
        } as Activity)

      when(activitiesService.fetchActivityWaitlist)
        .calledWith(atLeast(1, false))
        .mockResolvedValue([
          { status: 'ALLOCATED' },
          { status: 'PENDING' },
          { status: 'APPROVED' },
        ] as WaitingListApplication[])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/waitlist-application/confirmation', {
        waitListApplicationJourney: {
          prisoner: { name: 'Alan Key', prisonerNumber: 'ABC1234' },
          activity: {
            activityId: 1,
            scheduleId: 1,
          },
        },
        waitlistSize: 2,
        vacancies: 2,
        currentlyAllocated: 3,
        capacity: 5,
      })
      expect(req.journeyData.waitListApplicationJourney).toBeUndefined()
    })
  })
})
