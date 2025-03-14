import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import SetUpPrisonerListMethodRoutes from './setUpPrisonerListMethod'
import HowToAddOptions from '../../../../../enum/allocations'
import { ActivitySchedule } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Allocate multiple people to an activity - method for adding list', () => {
  const handler = new SetUpPrisonerListMethodRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      locals: {
        user: {
          username: 'test.user',
        },
      },
    } as unknown as Response

    req = {
      session: {},
      query: {},
    } as unknown as Request
  })
  describe('GET', () => {
    it('should render the how to add prisoners view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/setUpPrisonerListMethod',
      )
    })
  })
  describe('POST', () => {
    it('should redirect to select prisoner page', async () => {
      const schedule = {
        id: 100,
        description: 'Activity 100',
        internalLocation: {
          description: 'A-WING',
        },
        startDate: '01-01-2025',
        endDate: null,
        scheduleWeeks: 1,
        activity: {
          id: 100,
          inCell: false,
          onWing: false,
          offWing: true,
          paid: true,
        },
      } as ActivitySchedule
      req.body = {
        howToAdd: HowToAddOptions.SEARCH,
      }
      when(activitiesService.getActivitySchedule).mockResolvedValue(schedule)
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-prisoner')

      expect(req.session.allocateJourney).toEqual({
        inmates: [],
        activity: {
          activityId: 100,
          scheduleId: 100,
          name: 'Activity 100',
          location: 'A-WING',
          inCell: false,
          onWing: false,
          offWing: true,
          startDate: '01-01-2025',
          endDate: null,
          scheduleWeeks: 1,
          paid: true,
        },
      })
    })
  })
})
