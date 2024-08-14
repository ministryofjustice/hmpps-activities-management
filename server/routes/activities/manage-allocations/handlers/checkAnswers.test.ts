import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import atLeast from '../../../../../jest.setup'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import { StartDateOption } from '../journey'

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
          startDateOptions: StartDateOption.START_DATE,
          startDate: '2023-01-01',
          deallocationReason: 'COMPLETED',
          endDate: '2023-02-01',
          updatedExclusions: [],
          deallocationCaseNote: { type: 'GEN', text: 'test case note' },
          scheduledInstance: { id: 123 },
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
        deallocationReason: { code: 'COMPLETED', description: 'Completed' },
        currentWeek: 1,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: ['AM'],
            },
            {
              day: 'Tuesday',
              slots: ['AM'],
            },
            {
              day: 'Wednesday',
              slots: ['AM'],
            },
            {
              day: 'Thursday',
              slots: ['AM'],
            },
            {
              day: 'Friday',
              slots: ['AM'],
            },
            {
              day: 'Saturday',
              slots: ['AM'],
            },
            {
              day: 'Sunday',
              slots: ['AM'],
            },
          ],
        },
      })
    })
  })

  describe('POST', () => {
    describe('New Allocation', () => {
      it('should redirect to confirmation page when start date is a specific date', async () => {
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
          null,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })

      it('should redirect to confirmation page when start date is next session', async () => {
        req.session.allocateJourney.startDateOption = StartDateOption.NEXT_SESSION
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
          123,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })
    })

    describe('Remove Allocation', () => {
      it('should deallocate and redirect to confirmation page', async () => {
        req.params.mode = 'remove'
        await handler.POST(req, res)
        expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
          1,
          ['ABC123'],
          'COMPLETED',
          { type: 'GEN', text: 'test case note' },
          '2023-02-01',
          { username: 'joebloggs' },
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })
    })
  })
})
