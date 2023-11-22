import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import atLeast from '../../../../../jest.setup'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService)
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

    const inmate = {
      prisonerName: 'Joe Bloggs',
      prisonerNumber: 'ABC123',
      cellLocation: '1-2-001',
      incentiveLevel: 'standard',
      payBand: { id: 1, alias: 'A', rate: 150 },
    }

    req = {
      params: { mode: 'create' },
      session: {
        allocateJourney: {
          inmate,
          inmates: [inmate],
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
            startDate: '2022-01-01',
          },
          startDate: '2023-01-01',
          deallocationReason: 'COMPLETED',
          endDate: '2023-02-01',
          updatedExclusions: [],
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with data from session', async () => {
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue(activitySchedule as unknown as ActivitySchedule)

      when(activitiesService.getDeallocationReasons).mockResolvedValue([
        { code: 'COMPLETED', description: 'Completed' },
      ])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/check-answers', {
        deallocationReason: 'Completed',
        currentWeek: 1,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: ['am'],
            },
            {
              day: 'Tuesday',
              slots: ['am'],
            },
            {
              day: 'Wednesday',
              slots: ['am'],
            },
            {
              day: 'Thursday',
              slots: ['am'],
            },
            {
              day: 'Friday',
              slots: ['am'],
            },
            {
              day: 'Saturday',
              slots: ['am'],
            },
            {
              day: 'Sunday',
              slots: ['am'],
            },
          ],
        },
      })
    })
  })

  describe('POST', () => {
    it('should create the allocation and redirect to confirmation page when in create mode', async () => {
      req.params.mode = 'create'
      await handler.POST(req, res)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'ABC123',
        1,
        { username: 'joebloggs' },
        '2023-01-01',
        '2023-02-01',
        [],
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })

    it('should create the allocation and redirect to confirmation page when in remove mode', async () => {
      req.params.mode = 'remove'
      await handler.POST(req, res)
      expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(1, ['ABC123'], 'COMPLETED', '2023-02-01', {
        username: 'joebloggs',
      })
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
  })
})
