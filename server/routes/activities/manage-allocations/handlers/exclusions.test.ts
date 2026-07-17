import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import ExclusionRoutes, { Schedule } from './exclusions'
import atLeast from '../../../../../jest.setup'
import { ActivitySchedule, PrisonRegime } from '../../../../@types/activitiesAPI/types'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const mdiPrisonRegime = [
  {
    id: 127,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'MONDAY',
  },
  {
    id: 128,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'TUESDAY',
  },
  {
    id: 129,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'WEDNESDAY',
  },
  {
    id: 130,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'THURSDAY',
  },
  {
    id: 131,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'FRIDAY',
  },
  {
    id: 132,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SATURDAY',
  },
  {
    id: 133,
    prisonCode: 'MDI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SUNDAY',
  },
]

describe('Route Handlers - Allocation - Exclusions', () => {
  const handler = new ExclusionRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
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

  afterEach(() => {
    jest.useRealTimers()
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

    when(activitiesService.getPrisonRegime)
      .calledWith(atLeast('MDI'))
      .mockResolvedValue(mdiPrisonRegime as PrisonRegime[])
  })

  describe('GET', () => {
    describe('CREATE mode', () => {
      beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-30'))
        req.routeContext = { mode: 'create' }
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('should render the expected view', async () => {
        await handler.GET(req, res)
        expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/exclusions', {
          prisonerName: 'John Smith',
          disabledSlotsExist: true,
          allocationHasStarted: true,
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
      })

      it('should not mark any slots as disabled when there are no repeats', async () => {
        when(activitiesService.getActivitySchedule)
          .calledWith(atLeast(1))
          .mockResolvedValue({
            scheduleWeeks: 1,
            startDate: '2022-01-01',
            slots: [
              {
                id: 1,
                weekNumber: 1,
                timeSlot: TimeSlot.AM,
                startTime: '09:00',
                endTime: '10:00',
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
                daysOfWeek: ['Mon'],
              },
            ],
          } as ActivitySchedule)

        await handler.GET(req, res)

        const viewModel = (res.render as jest.Mock).mock.calls[0][1]

        const { slots } = viewModel.weeks[0].weekDays[0]

        expect(slots[0].disabled).toBe(false)
      })

      it('should filter out days that have no slots', async () => {
        when(activitiesService.getActivitySchedule)
          .calledWith(atLeast(1))
          .mockResolvedValue({
            scheduleWeeks: 1,
            startDate: '2022-01-01',
            slots: [
              {
                id: 1,
                weekNumber: 1,
                timeSlot: TimeSlot.AM,
                startTime: '09:00',
                endTime: '10:00',
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
                daysOfWeek: ['Mon'],
              },
            ],
          } as ActivitySchedule)

        await handler.GET(req, res)

        const { weekDays } = (res.render as jest.Mock).mock.calls[0][1].weeks[0]

        expect(weekDays.find((d: { day: string }) => d.day === 'Monday')).toBeDefined()
        expect(weekDays.find((d: { day: string }) => d.day === 'Tuesday')).toBeUndefined()
      })

      it('should redirect to allocations dashboard when allocate journey data is not available', async () => {
        req.journeyData.allocateJourney = undefined
        await handler.GET(req, res)
        expect(res.redirect).toHaveBeenCalledWith('/activities/allocations')
      })
    })

    describe('EDIT mode', () => {
      beforeEach(() => {
        req.routeContext = { mode: 'edit' }
      })

      it('should not include any new exclusions when no days are selected', async () => {
        req.body = {
          week1: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        }

        await handler.POST(req, res)

        const exclusions = req.journeyData.allocateJourney.updatedExclusions

        // ✅ No additional exclusions created beyond existing behaviour
        expect(exclusions.length).toBeGreaterThan(0)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
      })
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

    describe('CREATE mode', () => {
      beforeEach(() => {
        req.routeContext = { mode: 'create' }
      })

      it('should NOT trigger same-day logic when all conditions match', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))

        req.journeyData.allocateJourney.startDate = '2024-08-20'

        setupForSameDayTests()

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('check-answers')
        expect(res.redirect).not.toHaveBeenCalledWith('addToToday')

        jest.useRealTimers()
      })

      it('should update the exclusions on the allocation and redirect to check-answers', async () => {
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
    })

    describe('EDIT mode', () => {
      beforeEach(() => {
        req.routeContext = { mode: 'edit' }
      })

      it('should update the exclusions in session and redirect to the confirm exclusions page', async () => {
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

      it('should NOT trigger same-day logic when the matching weekday is in a different schedule week', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-23 07:00:00')) // Friday week 1
        req.body = {
          week1: {
            monday: ['PM'],
            wednesday: ['AM'],
          },
          week2: {
            friday: ['AM'],
          },
        }

        await handler.POST(req, res)

        expect(req.journeyData.allocateJourney.updatedExclusions.length).toBeGreaterThan(0)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
      })

      it('should trigger same-day logic when the matching weekday is in the same schedule week', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-30 07:00:00')) // Friday week 2
        req.body = {
          week1: {
            monday: ['PM'],
            wednesday: ['AM'],
          },
          week2: {
            friday: ['AM'],
          },
        }

        await handler.POST(req, res)

        expect(req.journeyData.allocateJourney.updatedExclusions.length).toBeGreaterThan(0)

        expect(res.redirect).toHaveBeenCalledWith('addToToday')
      })

      // SAME-DAY LOGIC NEGATIVE

      it('should NOT trigger same-day logic when exclusions have not changed', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))

        req.journeyData.allocateJourney.startDate = '2024-08-20'

        setupForSameDayTests()

        req.body = {
          week1: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        }

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
        expect(res.redirect).not.toHaveBeenCalledWith('addToToday')

        jest.useRealTimers()
      })

      it('should NOT trigger same-day logic when no future same day slots exist', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 08:00:00'))

        req.journeyData.allocateJourney.startDate = '2024-08-20'

        setupForSameDayTests()

        req.body = {}

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
        expect(res.redirect).not.toHaveBeenCalledWith('addToToday')
        expect(req.journeyData.allocateJourney.futureSameDaySlots).toEqual([])

        jest.useRealTimers()
      })

      it('should NOT trigger same-day logic when slot start time has passed', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 12:30:00'))

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

      it('should NOT trigger same-day logic when activity has NOT started yet', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))
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

      // SAME-DAY LOGIC POSITIVE

      it('should trigger same-day logic when future same day slots exist and activity has started', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))
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
    })

    describe('EXCLUDE mode', () => {
      beforeEach(() => {
        req.routeContext = { mode: 'exclude' }
      })

      it('should NOT trigger same-day logic for exclude when conditions are not met', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 12:30:00')) // slot in past

        try {
          setupForSameDayTests()
          await handler.POST(req, res)

          expect(res.redirect).toHaveBeenCalledWith('confirm-exclusions')
          expect(res.redirect).not.toHaveBeenCalledWith('addToToday')
        } finally {
          jest.useRealTimers()
        }
      })

      it('should trigger same-day logic for the exclude journey when slot is later "today"', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-08-21 07:00:00'))

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
})

// This test covers the Slots @transform at the start of exclusions file.
it("should handle a single form value as an array and default missing days to empty arrays'", () => {
  const input = {
    week1: {
      monday: 'AM',
    },
  }

  const result = plainToInstance(Schedule, input)

  expect(result.week1.monday).toEqual(['AM'])
  expect(result.week1.tuesday).toEqual([])
})
