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
            startTime: '09:00',
            endTime: '12:00',
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
        weeklySlots: {
          1: [
            {
              day: 'MONDAY',
              slots: ['AM'],
            },
            {
              day: 'TUESDAY',
              slots: [],
            },
            {
              day: 'WEDNESDAY',
              slots: [],
            },
            {
              day: 'THURSDAY',
              slots: [],
            },
            {
              day: 'FRIDAY',
              slots: [],
            },
            {
              day: 'SATURDAY',
              slots: [],
            },
            {
              day: 'SUNDAY',
              slots: [],
            },
          ],
          2: [
            {
              day: 'MONDAY',
              slots: ['AM'],
            },
            {
              day: 'TUESDAY',
              slots: ['AM'],
            },
            {
              day: 'WEDNESDAY',
              slots: ['AM'],
            },
            {
              day: 'THURSDAY',
              slots: ['AM'],
            },
            {
              day: 'FRIDAY',
              slots: ['AM'],
            },
            {
              day: 'SATURDAY',
              slots: ['AM'],
            },
            {
              day: 'SUNDAY',
              slots: ['AM'],
            },
          ],
        },
        exclusions: [],
        disabledSlots: ['MONDAYAM'],
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
          weekNumber: 1,
          timeSlot: 'AM',
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

    it('should update the exclusions in session and redirect when in create mode', async () => {
      req.params.mode = 'edit'
      req.params.allocationId = '1'

      req.body = {
        week2: {
          monday: ['am'],
        },
      }

      expect(req.session.allocateJourney.updatedExclusions).toHaveLength(0)

      await handler.POST(req, res)

      expect(req.session.allocateJourney.updatedExclusions).toEqual([
        {
          weekNumber: 1,
          timeSlot: 'AM',
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

      expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
    })
  })
})
