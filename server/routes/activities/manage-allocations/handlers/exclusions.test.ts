import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import ExclusionRoutes from './exclusions'
import atLeast from '../../../../../jest.setup'
import { ActivitySchedule } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'
import config from '../../../../config'

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
      params: {},
      routeContext: { mode: 'create' },
      journeyData: {
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
      config.sameDayScheduleModificationsEnabled = false

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/exclusions', {
        prisonerName: 'John Smith',
        disabledSlotsExist: true,
        allocationHasStarted: true,
        sameDayScheduleModificationsEnabled: false,
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
                    disabled: false,
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
                    disabled: true,
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
                    disabled: true,
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
                    disabled: false,
                  },
                ],
              },
            ],
          },
        ],
      })
      jest.useRealTimers()
    })

    it('should redirect to allocations dashboard when allocate journey data is not available', async () => {
      req.journeyData.allocateJourney = undefined
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocations')
    })
  })

  describe('POST', () => {
    let setupForSameDayTests: () => void

    beforeEach(() => {
      setupForSameDayTests = () => {
        req.journeyData.allocateJourney.futureSameDaySlots = [
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
        ]
        req.journeyData.allocateJourney.addToSessionsToday = true
        req.journeyData.allocateJourney.exclusions = [
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
        ]

        req.routeContext = { mode: 'edit' }
        req.params.allocationId = '1'
        req.body = {
          week1: {
            monday: [],
            tuesday: [],
            wednesday: ['AM'],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        }
      }
    })

    it('should update the exclusions on the allocation and redirect when in create mode', async () => {
      req.routeContext = { mode: 'create' }
      req.body = {
        week2: {
          monday: ['AM'],
        },
      }
      await handler.POST(req, res)
      expect(req.journeyData.allocateJourney.updatedExclusions).toEqual([
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
      req.routeContext = { mode: 'edit' }
      req.params.allocationId = '1'

      req.body = {
        week2: {
          monday: ['AM'],
        },
      }

      expect(req.journeyData.allocateJourney.updatedExclusions).toHaveLength(0)

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.updatedExclusions).toEqual([
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
      req.routeContext = { mode: 'edit' }
      req.params.allocationId = '1'

      req.body = {}

      expect(req.journeyData.allocateJourney.updatedExclusions).toHaveLength(0)

      await handler.POST(req, res)

      expect(req.journeyData.allocateJourney.updatedExclusions).toEqual([
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

    it('should NOT redirect to addToToday when feature flag is disabled and future same day slots exist', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-08-21 08:00:00'))
      config.sameDayScheduleModificationsEnabled = false

      try {
        setupForSameDayTests()

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
        expect(res.redirect).not.toHaveBeenCalledWith('addToToday')
        expect(req.journeyData.allocateJourney.futureSameDaySlots).toEqual([])
        expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(undefined)
      } finally {
        jest.useRealTimers()
      }
    })

    it('should NOT redirect to addToToday when feature flag is enabled and slot start time has passed', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-08-21 12:30:00'))
      config.sameDayScheduleModificationsEnabled = true

      try {
        setupForSameDayTests()

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
        expect(res.redirect).not.toHaveBeenCalledWith('addToToday')
        expect(req.journeyData.allocateJourney.futureSameDaySlots).toEqual([])
        expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(undefined)
      } finally {
        jest.useRealTimers()
      }
    })

    it('should NOT redirect to addToToday when feature flag is enabled but activity has NOT started yet', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))
      config.sameDayScheduleModificationsEnabled = true
      req.journeyData.allocateJourney.startDate = '2024-08-22'

      try {
        setupForSameDayTests()

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
        expect(res.redirect).not.toHaveBeenCalledWith('addToToday')
        expect(req.journeyData.allocateJourney.futureSameDaySlots).toEqual([])
        expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(undefined)
      } finally {
        jest.useRealTimers()
      }
    })

    it('should redirect to addToToday when feature flag is enabled, future same day slots exist and activity has started', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))
      config.sameDayScheduleModificationsEnabled = true
      req.journeyData.allocateJourney.startDate = '2024-08-20'

      try {
        setupForSameDayTests()

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('addToToday')
        expect(res.redirect).not.toHaveBeenCalledWith('confirm-exclusions')
        expect(req.journeyData.allocateJourney.futureSameDaySlots).toEqual([
          {
            customEndTime: undefined,
            customStartTime: undefined,
            daysOfWeek: ['WEDNESDAY'],
            friday: false,
            monday: false,
            saturday: false,
            sunday: false,
            thursday: false,
            timeSlot: 'AM',
            tuesday: false,
            wednesday: true,
            weekNumber: 1,
          },
        ])
        expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(undefined)
      } finally {
        jest.useRealTimers()
      }
    })

    it('should redirect to addToToday when feature flag is enabled and slot is later "today"', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))
      config.sameDayScheduleModificationsEnabled = true

      try {
        setupForSameDayTests()

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('addToToday')
        expect(res.redirect).not.toHaveBeenCalledWith('confirm-exclusions')
        expect(req.journeyData.allocateJourney.futureSameDaySlots.length).toBeGreaterThan(0)
        expect(req.journeyData.allocateJourney.addToSessionsToday).toBe(undefined)
      } finally {
        jest.useRealTimers()
      }
    })
  })
})
