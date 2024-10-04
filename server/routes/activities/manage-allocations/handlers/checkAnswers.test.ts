import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import atLeast from '../../../../../jest.setup'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import activitySchedule2 from '../../../../services/fixtures/activity_schedule_2.json'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import { DeallocateTodayOption, StartDateOption } from '../journey'

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
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '10:00',
                  endTime: '11:00',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  timeSlot: 'AM',
                  startTime: '11:00',
                  endTime: '12:00',
                },
              ],
            },
          ],
        },
      })
    })

    it('should render page with data from session with custom scheduled slots', async () => {
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(876))
        .mockResolvedValue(activitySchedule2 as unknown as ActivitySchedule)

      when(activitiesService.getDeallocationReasons).mockResolvedValue([
        { code: 'COMPLETED', description: 'Completed' },
      ])

      req.session.allocateJourney.activity = {
        activityId: 877,
        scheduleId: 876,
        name: 'EDUCATION COURSE ALBANY',
        location: 'SITE 2',
        inCell: false,
        onWing: false,
        offWing: false,
        startDate: '2024-09-24',
        endDate: null,
        scheduleWeeks: 1,
        paid: true,
      }
      req.session.allocateJourney.updatedExclusions = [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: false,
          daysOfWeek: ['FRIDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
        },
      ]

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/check-answers', {
        deallocationReason: { code: 'COMPLETED', description: 'Completed' },
        currentWeek: 1,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: [
                {
                  timeSlot: 'PM',
                  startTime: '13:40',
                  endTime: '16:50',
                },
              ],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  timeSlot: 'PM',
                  startTime: '13:40',
                  endTime: '16:50',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  timeSlot: 'PM',
                  startTime: '13:40',
                  endTime: '16:50',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  timeSlot: 'PM',
                  startTime: '13:40',
                  endTime: '16:50',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [],
            },
            {
              day: 'Saturday',
              slots: [],
            },
            {
              day: 'Sunday',
              slots: [],
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

      it('should redirect to confirmation page when with custom scheduled slots and exclusions', async () => {
        req.params.mode = 'create'
        req.session.allocateJourney.activity = {
          activityId: 877,
          scheduleId: 876,
          name: 'EDUCATION COURSE ALBANY',
          location: 'SITE 2',
          inCell: false,
          onWing: false,
          offWing: false,
          startDate: '2024-09-24',
          endDate: null,
          scheduleWeeks: 1,
          paid: true,
        }
        req.session.allocateJourney.updatedExclusions = [
          {
            weekNumber: 1,
            timeSlot: 'AM',
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: false,
            friday: true,
            saturday: false,
            sunday: false,
            daysOfWeek: ['FRIDAY', 'MONDAY', 'WEDNESDAY'],
          },
          {
            weekNumber: 1,
            timeSlot: 'AM',
            monday: true,
            tuesday: false,
            wednesday: true,
            thursday: false,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['MONDAY', 'WEDNESDAY'],
          },
          {
            weekNumber: 1,
            timeSlot: 'PM',
            monday: false,
            tuesday: true,
            wednesday: false,
            thursday: true,
            friday: false,
            saturday: false,
            sunday: false,
            daysOfWeek: ['TUESDAY', 'THURSDAY'],
          },
        ]

        await handler.POST(req, res)
        expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
          876,
          'ABC123',
          1,
          { username: 'joebloggs' },
          '2023-01-01',
          '2023-02-01',
          [
            {
              weekNumber: 1,
              timeSlot: 'AM',
              monday: true,
              tuesday: false,
              wednesday: true,
              thursday: false,
              friday: true,
              saturday: false,
              sunday: false,
              daysOfWeek: ['FRIDAY', 'MONDAY', 'WEDNESDAY'],
            },
            {
              weekNumber: 1,
              timeSlot: 'PM',
              monday: false,
              tuesday: true,
              wednesday: false,
              thursday: true,
              friday: false,
              saturday: false,
              sunday: false,
              daysOfWeek: ['TUESDAY', 'THURSDAY'],
            },
          ],
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
      it('should deallocate and redirect to confirmation page when deallocating sessions from a future day', async () => {
        req.params.mode = 'remove'

        await handler.POST(req, res)

        expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
          1,
          ['ABC123'],
          'COMPLETED',
          { type: 'GEN', text: 'test case note' },
          '2023-02-01',
          { username: 'joebloggs' },
          null,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })

      it('should deallocate and redirect to confirmation page when deallocating sessions today', async () => {
        req.params.mode = 'remove'
        req.session.allocateJourney.deallocateTodayOption = DeallocateTodayOption.TODAY

        await handler.POST(req, res)

        expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
          1,
          ['ABC123'],
          'COMPLETED',
          { type: 'GEN', text: 'test case note' },
          '2023-02-01',
          { username: 'joebloggs' },
          123,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })
    })
  })
})
