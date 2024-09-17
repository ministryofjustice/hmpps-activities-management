import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ExclusionRoutes from './exclusions'
import atLeast from '../../../../../jest.setup'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation - Exclusions', () => {
  const handler = new ExclusionRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'LEI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create' },
      session: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
            name: 'Test Activity',
          },
          exclusions: [
            {
              weekNumber: 2,
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
          ],
          updatedExclusions: [],
        },
      },
    } as unknown as Request
  })

  beforeEach(() => {
    when(activitiesService.getActivitySchedule)
      .calledWith(atLeast(1))
      .mockResolvedValue({
        scheduleWeeks: 2,
        startDate: '2022-01-01',
        slots: [
          {
            id: 1,
            weekNumber: 1,
            timeSlot: TimeSlot.PM,
            startTime: '13:35',
            endTime: '14:00',
            mondayFlag: true,
            tuesdayFlag: false,
            wednesdayFlag: false,
            thursdayFlag: false,
            fridayFlag: false,
            saturdayFlag: false,
            sundayFlag: false,
            daysOfWeek: ['Mon'],
          },
          {
            id: 2,
            weekNumber: 1,
            timeSlot: TimeSlot.AM,
            startTime: '09:20',
            endTime: '12:20',
            mondayFlag: false,
            tuesdayFlag: false,
            wednesdayFlag: true,
            thursdayFlag: false,
            fridayFlag: false,
            saturdayFlag: false,
            sundayFlag: false,
            daysOfWeek: ['Wed'],
          },
          {
            id: 3,
            weekNumber: 2,
            startTime: '10:00',
            endTime: '11:00',
            timeSlot: TimeSlot.AM,
            mondayFlag: false,
            tuesdayFlag: false,
            wednesdayFlag: true,
            thursdayFlag: false,
            fridayFlag: true,
            saturdayFlag: false,
            sundayFlag: false,
            daysOfWeek: ['Wed', 'Fri'],
          },
        ],
      } as ActivitySchedule)
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-08-30'))

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/exclusions', {
        prisonerName: 'John Smith',
        weeks: [
          {
            weekNumber: 1,
            currentWeek: false,
            weekDays: [
              {
                day: 'Monday',
                slots: [
                  {
                    timeSlot: 'PM',
                    startTime: '13:35',
                    endTime: '14:00',
                    excluded: false,
                  },
                ],
              },
              {
                day: 'Wednesday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '09:20',
                    endTime: '12:20',
                    excluded: false,
                  },
                ],
              },
              { day: 'Friday', slots: [] },
            ],
          },
          {
            weekNumber: 2,
            currentWeek: true,
            weekDays: [
              { day: 'Monday', slots: [] },
              {
                day: 'Wednesday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '10:00',
                    endTime: '11:00',
                    excluded: false,
                  },
                ],
              },
              {
                day: 'Friday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '10:00',
                    endTime: '11:00',
                    excluded: true,
                  },
                ],
              },
            ],
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should update the exclusions on the allocation and redirect when in create mode', async () => {
      req.params.mode = 'create'
      req.body = {
        week2: {
          monday: ['AM'],
        },
      }
      await handler.POST(req, res)
      expect(req.session.allocateJourney.updatedExclusions).toEqual([
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['WEDNESDAY'],
        },
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: false,
          daysOfWeek: ['WEDNESDAY', 'FRIDAY'],
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })

    it('should update the exclusions in session and redirect when in create mode', async () => {
      req.params.mode = 'edit'
      req.params.allocationId = '1'

      req.body = {
        week2: {
          monday: ['AM'],
        },
      }

      expect(req.session.allocateJourney.updatedExclusions).toHaveLength(0)

      await handler.POST(req, res)

      expect(req.session.allocateJourney.updatedExclusions).toEqual([
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['WEDNESDAY'],
        },
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: false,
          daysOfWeek: ['WEDNESDAY', 'FRIDAY'],
        },
      ])

      expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
    })

    it('should allow zero slots to be selected', async () => {
      req.params.mode = 'edit'
      req.params.allocationId = '1'

      req.body = {}

      expect(req.session.allocateJourney.updatedExclusions).toHaveLength(0)

      await handler.POST(req, res)

      expect(req.session.allocateJourney.updatedExclusions).toEqual([
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: true,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['MONDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['WEDNESDAY'],
        },
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: true,
          thursday: false,
          friday: true,
          saturday: false,
          sunday: false,
          daysOfWeek: ['WEDNESDAY', 'FRIDAY'],
        },
      ])

      expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
    })
  })
})
