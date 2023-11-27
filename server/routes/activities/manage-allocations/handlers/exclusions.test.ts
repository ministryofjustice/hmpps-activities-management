import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ExclusionRoutes from './exclusions'
import atLeast from '../../../../../jest.setup'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import calcCurrentWeek from '../../../../utils/helpers/currentWeekCalculator'

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
          exclusions: [],
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
            weekNumber: 2,
            startTime: '09:00',
            endTime: '12:00',
            mondayFlag: true,
            tuesdayFlag: true,
            wednesdayFlag: true,
            thursdayFlag: true,
            fridayFlag: true,
            saturdayFlag: true,
            sundayFlag: true,
            daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          },
        ],
      } as ActivitySchedule)
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/exclusions', {
        currentWeek: calcCurrentWeek(new Date('2022-01-01'), 2),
        dailySlots: [
          {
            day: 'MONDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
          {
            day: 'TUESDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
          {
            day: 'WEDNESDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
          {
            day: 'THURSDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
          {
            day: 'FRIDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
          {
            day: 'SATURDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
          {
            day: 'SUNDAY',
            weeks: [
              {
                slots: [],
                weekNumber: 1,
              },
              {
                slots: ['AM'],
                weekNumber: 2,
              },
            ],
          },
        ],
        exclusions: [],
        prisonerName: 'John Smith',
        scheduleWeeks: 2,
      })
    })
  })

  describe('POST', () => {
    it('should throw validation error if no slots are selected', async () => {
      req.body = {}
      await handler.POST(req, res)
      expect(res.validationFailed).toHaveBeenCalledWith('slots', 'Select at least one session')
      expect(activitiesService.updateAllocation).not.toHaveBeenCalled()
    })

    it('should update the exclusions on the allocation and redirect when in create mode', async () => {
      req.params.mode = 'create'
      req.body = {
        week2: {
          monday: ['am'],
        },
      }
      await handler.POST(req, res)
      expect(req.session.allocateJourney.updatedExclusions).toEqual([
        {
          weekNumber: 2,
          timeSlot: 'AM',
          monday: false,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
          daysOfWeek: ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        },
      ])
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })

    it('should update the exclusions on the allocation and redirect when in edit mode', async () => {
      req.params.mode = 'edit'
      req.params.allocationId = '1'

      req.body = {
        week2: {
          monday: ['am'],
        },
      }

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith('LEI', 1, {
        exclusions: [
          {
            weekNumber: 2,
            timeSlot: 'AM',
            monday: false,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
            daysOfWeek: ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
          },
        ],
      })
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/allocations/view/1',
        'Allocation updated',
        "You've updated the exclusions for this allocation",
      )
    })

    it('should update the exclusions on the allocation and redirect when in exclude mode', async () => {
      req.params.mode = 'exclude'
      req.params.allocationId = '1'

      req.body = {
        week2: {
          monday: ['am'],
        },
      }

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith('LEI', 1, {
        exclusions: [
          {
            weekNumber: 2,
            timeSlot: 'AM',
            monday: false,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
            daysOfWeek: ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
          },
        ],
      })
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/exclusions/prisoner/ABC123',
        'You have updated when John Smith should attend Test Activity',
      )
    })
  })
})
