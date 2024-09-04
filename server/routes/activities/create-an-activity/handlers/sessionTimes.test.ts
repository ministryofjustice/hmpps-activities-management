import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import atLeast from '../../../../../jest.setup'
import SessionTimesRoutes, {
  addNewEmptySlotsIfRequired,
  filterUnrequiredSlots,
  SessionSlot,
  SessionTimes,
} from './sessionTimes'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, PrisonRegime } from '../../../../@types/activitiesAPI/types'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import TimeSlot from '../../../../enum/timeSlot'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import activity from '../../../../services/fixtures/activity_1.json'
import { DaysAndSlotsInRegime } from '../../../../utils/helpers/applicableRegimeTimeUtil'
import activitySchedule from '../../../../services/fixtures/activity_schedule_bi_weekly_1.json'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const prisonRegime: PrisonRegime[] = [
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'MONDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'TUESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'WEDNESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'THURSDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'FRIDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SATURDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SUNDAY',
  },
]

describe('Route Handlers - Create an activity schedule - session times', () => {
  const handler = new SessionTimesRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
      addValidationError: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          slots: {
            '1': {
              days: ['tuesday', 'friday'],
              timeSlotsTuesday: ['AM'],
              timeSlotsFriday: ['PM', 'ED'],
            },
          },
          scheduleWeeks: 1,
        },
      },
      params: {},
    } as unknown as Request

    req.query = {}

    activitiesService.getPrisonRegime.mockReturnValue(Promise.resolve(prisonRegime))
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      const expectedSessionSlots: Map<string, DaysAndSlotsInRegime[] | SessionSlot[]> = new Map<
        string,
        DaysAndSlotsInRegime[] | SessionSlot[]
      >()
      expectedSessionSlots.set('1', [
        {
          dayOfWeek: 'TUESDAY',
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: 'FRIDAY',
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: 'FRIDAY',
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
      ])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/session-times', {
        sessionSlots: expectedSessionSlots,
      })
    })

    it('should render the expected view in edit mode with a two weekly schedule', async () => {
      const mockActivity = {
        attendanceRequired: false,
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        createdBy: '',
        createdTime: '',
        description: 'A basic maths course suitable for introduction to the subject',
        eligibilityRules: [],
        inCell: false,
        outsideWork: false,
        pay: [],
        payPerSession: 'H',
        pieceWork: false,
        prisonCode: '',
        riskLevel: '',
        schedules: [activitySchedule],
        summary: 'Maths Level 1',
        tier: { code: '', description: '', id: 0 },
        waitingList: [],
        id: 1,
        minimumEducationLevel: [],
      } as unknown as Activity

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValueOnce({
          ...mockActivity,
        })

      req.params.mode = 'edit'
      req.session.createJourney.activityId = 1
      req.session.createJourney.scheduleWeeks = 2
      req.session.createJourney.slots = {
        '1': {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          timeSlotsMonday: ['AM'],
          timeSlotsTuesday: ['AM'],
          timeSlotsWednesday: ['AM'],
          timeSlotsThursday: ['AM'],
          timeSlotsFriday: ['AM'],
          timeSlotsSaturday: ['AM'],
          timeSlotsSunday: ['AM'],
        },
        '2': {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          timeSlotsMonday: ['AM'],
          timeSlotsTuesday: ['AM'],
          timeSlotsWednesday: ['AM'],
          timeSlotsThursday: ['AM'],
          timeSlotsFriday: ['AM'],
          timeSlotsSaturday: ['AM'],
          timeSlotsSunday: ['AM'],
        },
      }

      const expectedSessionSlots: Map<string, DaysAndSlotsInRegime[] | SessionSlot[]> = new Map<
        string,
        DaysAndSlotsInRegime[] | SessionSlot[]
      >()
      expectedSessionSlots.set('1', [
        {
          dayOfWeek: 'MONDAY',
          timeSlot: TimeSlot.AM,
          start: '10:00',
          finish: '11:00',
        },
        {
          dayOfWeek: 'TUESDAY',
          timeSlot: TimeSlot.AM,
          start: '10:00',
          finish: '11:00',
        },
        {
          dayOfWeek: 'WEDNESDAY',
          timeSlot: TimeSlot.AM,
          start: '10:00',
          finish: '11:00',
        },
        {
          dayOfWeek: 'THURSDAY',
          timeSlot: TimeSlot.AM,
          start: '11:00',
          finish: '12:00',
        },
        {
          dayOfWeek: 'FRIDAY',
          timeSlot: TimeSlot.AM,
          start: '11:00',
          finish: '12:00',
        },
        {
          dayOfWeek: 'SATURDAY',
          timeSlot: TimeSlot.AM,
          start: '11:00',
          finish: '12:00',
        },
        {
          dayOfWeek: 'SUNDAY',
          timeSlot: TimeSlot.AM,
          start: '11:00',
          finish: '12:00',
        },
      ])
      expectedSessionSlots.set('2', [
        {
          dayOfWeek: 'MONDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
        {
          dayOfWeek: 'TUESDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
        {
          dayOfWeek: 'WEDNESDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
        {
          dayOfWeek: 'THURSDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
        {
          dayOfWeek: 'FRIDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
        {
          dayOfWeek: 'SATURDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
        {
          dayOfWeek: 'SUNDAY',
          timeSlot: TimeSlot.AM,
          start: '10:30',
          finish: '11:30',
        },
      ])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/session-times', {
        sessionSlots: expectedSessionSlots,
      })
    })
  })

  describe('addNewEmptySlotsIfRequired function', () => {
    it("shouldn't add any empty slots if there are no newly selected ones", () => {
      const sessionSlots = [
        { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.AM, start: '10:00', finish: '11:00' },
        { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.PM, start: '12:00', finish: '13:00' },
      ]
      const newlySelectedSlots = {
        days: ['monday'],
        timeSlotsMonday: ['AM', 'PM'],
      }
      const result = addNewEmptySlotsIfRequired(sessionSlots, newlySelectedSlots)
      expect(result).toEqual(sessionSlots)
    })
    it('should add empty slots if there are new ones present, with undefined times', () => {
      const sessionSlots = [{ dayOfWeek: 'MONDAY', timeSlot: TimeSlot.AM, start: '10:00', finish: '11:00' }]
      const newlySelectedSlots = {
        days: ['monday', 'tuesday'],
        timeSlotsMonday: ['AM', 'PM'],
        timeSlotsTuesday: ['AM', 'PM', 'ED'],
      }
      const result = addNewEmptySlotsIfRequired(sessionSlots, newlySelectedSlots)
      expect(result).toEqual([
        { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.AM, start: '10:00', finish: '11:00' },
        { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.PM, start: undefined, finish: undefined },
        { dayOfWeek: 'TUESDAY', timeSlot: TimeSlot.AM, start: undefined, finish: undefined },
        { dayOfWeek: 'TUESDAY', timeSlot: TimeSlot.PM, start: undefined, finish: undefined },
        { dayOfWeek: 'TUESDAY', timeSlot: TimeSlot.ED, start: undefined, finish: undefined },
      ])
    })
  })

  describe('filterUnrequiredSlots function', () => {
    it('Should remove sessions from sessionSlots if they are not selected anymore', () => {
      const sessionSlots = [
        {
          dayOfWeek: 'MONDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
        {
          dayOfWeek: 'WEDNESDAY',
          edStart: '17:30',
          edFinish: '20:45',
        },
        {
          dayOfWeek: 'FRIDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
      ]
      const newlySelectedSlots = {
        days: ['monday', 'wednesday', 'friday'],
        timeSlotsMonday: ['AM'],
        timeSlotsWednesday: ['ED'],
        timeSlotsFriday: ['PM'],
      }
      const expectedSlots = [
        {
          dayOfWeek: 'MONDAY',
          amStart: '07:30',
          amFinish: '11:45',
        },
        {
          dayOfWeek: 'WEDNESDAY',
          edStart: '17:30',
          edFinish: '20:45',
        },
        {
          dayOfWeek: 'FRIDAY',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
      ]
      const result = filterUnrequiredSlots(sessionSlots, newlySelectedSlots)
      expect(result).toEqual(expectedSlots)
    })
    it('Should return the same slots if nothing has changed', () => {
      const sessionSlots = [
        {
          dayOfWeek: 'MONDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
        {
          dayOfWeek: 'TUESDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
        {
          dayOfWeek: 'WEDNESDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
        {
          dayOfWeek: 'THURSDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
        {
          dayOfWeek: 'FRIDAY',
          amStart: '07:30',
          amFinish: '11:45',
          pmStart: '14:00',
          pmFinish: '17:30',
        },
      ]
      const newlySelectedSlots = {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timeSlotsMonday: ['AM', 'PM'],
        timeSlotsTuesday: ['AM', 'PM'],
        timeSlotsWednesday: ['AM', 'PM'],
        timeSlotsThursday: ['AM', 'PM'],
        timeSlotsFriday: ['AM', 'PM'],
      }
      const result = filterUnrequiredSlots(sessionSlots, newlySelectedSlots)
      expect(result).toEqual(sessionSlots)
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 5
      startTime.minute = 30

      startMap.set('1-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 9
      endTime.minute = 44

      endMap.set('1-MONDAY-AM', endTime)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }
    })

    afterEach(() => {
      expect(req.session.createJourney.customSlots).toEqual([
        {
          customStartTime: '05:30',
          customEndTime: '09:44',
          daysOfWeek: ['MONDAY'],
          friday: false,
          monday: true,
          saturday: false,
          sunday: false,
          thursday: false,
          timeSlot: TimeSlot.AM,
          tuesday: false,
          wednesday: false,
          weekNumber: 1,
        },
      ])
    })

    describe('Create journey', () => {
      it('when using custom times redirect to the bank holiday page', async () => {
        await handler.POST(req, res)

        expect(res.redirectOrReturn).toHaveBeenCalledWith('bank-holiday-option')
      })
    })

    describe('Change data from check answers page', () => {
      it('when using custom times redirect to the check answers page', async () => {
        req.query.preserveHistory = 'true'

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('check-answers')
      })
    })

    it('saves data and returns to view activity page if the user is in edit mode', async () => {
      const updatedActivity = {
        slots: [
          {
            customStartTime: '05:30',
            customEndTime: '09:44',
            daysOfWeek: ['MONDAY'],
            friday: false,
            monday: true,
            saturday: false,
            sunday: false,
            thursday: false,
            timeSlot: TimeSlot.AM,
            tuesday: false,
            wednesday: false,
            weekNumber: 1,
          },
        ],
        scheduleWeeks: 1,
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 5
      startTime.minute = 30

      startMap.set('1-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 9
      endTime.minute = 44

      endMap.set('1-MONDAY-AM', endTime)

      req = {
        params: {
          mode: 'edit',
        },
        body: {
          startTimes: startMap,
          endTimes: endMap,
        },
        query: {},
        session: {
          createJourney: {
            activityId: 1,
            name: 'Test activity',
            scheduleWeeks: 1,
          },
        },
      } as unknown as Request

      await handler.POST(req, res)
      expect(activitiesService.updateActivity).toHaveBeenCalledWith(1, updatedActivity, res.locals.user)
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/view/1`,
        'Activity updated',
        `You've updated the daily schedule for Test activity`,
      )
    })
  })

  describe('Validation', () => {
    it('should pass validation if start and end times set correctly', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 30

      endMap.set('MONDAY-AM', endTime)

      const startTime2 = new SimpleTime()
      startTime2.hour = 19
      startTime2.minute = 30

      startMap.set('FRIDAY-ED', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('FRIDAY-ED', endTime2)

      const body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      const requestObject = plainToInstance(SessionTimes, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toBe(0)
    })

    it('should fail validation when no start time hour specified', async () => {
      const body = {
        startTimes: {
          'MONDAY-AM': {
            hour: null as number,
            minute: 0,
          },
        },
      }

      const requestObject = plainToInstance(SessionTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an hour', property: 'hour' }]))
    })

    it('should fail validation when no start time minute specified', async () => {
      const body = {
        startTimes: {
          'MONDAY-AM': {
            hour: 12,
            minute: null as number,
          },
        },
      }

      const requestObject = plainToInstance(SessionTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select a minute', property: 'minute' }]))
    })

    it('should fail validation when no end time hour specified', async () => {
      const body = {
        endTimes: {
          'MONDAY-AM': {
            hour: null as number,
            minute: 0,
          },
        },
      }

      const requestObject = plainToInstance(SessionTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an hour', property: 'hour' }]))
    })

    it('should fail validation when no end time minute specified', async () => {
      const body = {
        endTimes: {
          'MONDAY-AM': {
            hour: 12,
            minute: null as number,
          },
        },
      }

      const requestObject = plainToInstance(SessionTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select a minute', property: 'minute' }]))
    })

    it('should fail validation if end time is before start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('1-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 9
      endTime.minute = 44

      endMap.set('1-MONDAY-AM', endTime)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `endTimes-1-MONDAY-AM`,
        'Select an end time after the start time',
      )
    })

    it('should fail validation if end time is the same as start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('1-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 10
      endTime.minute = 30

      endMap.set('1-MONDAY-AM', endTime)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `endTimes-1-MONDAY-AM`,
        'Select an end time after the start time',
      )
    })

    it('should fail validation if afternoon start is before the morning start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('1-FRIDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 30

      endMap.set('1-FRIDAY-AM', endTime)

      const startTime2 = new SimpleTime()
      startTime2.hour = 9
      startTime2.minute = 30

      startMap.set('1-FRIDAY-PM', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('1-FRIDAY-PM', endTime2)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-1-FRIDAY-PM`,
        'Start time must be after the earlier session start time',
      )
    })

    it('should fail validation if evening start is before the morning start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('1-FRIDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 30

      endMap.set('1-FRIDAY-AM', endTime)

      const startTime2 = new SimpleTime()
      startTime2.hour = 9
      startTime2.minute = 30

      startMap.set('1-FRIDAY-ED', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('1-FRIDAY-ED', endTime2)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-1-FRIDAY-ED`,
        'Start time must be after the earlier session start time',
      )
    })

    it('should fail validation if evening start is before the afternoon start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 13
      startTime.minute = 30

      startMap.set('1-FRIDAY-PM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 15
      endTime.minute = 30

      endMap.set('1-FRIDAY-PM', endTime)

      const startTime2 = new SimpleTime()
      startTime2.hour = 9
      startTime2.minute = 30

      startMap.set('1-FRIDAY-ED', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('1-FRIDAY-ED', endTime2)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-1-FRIDAY-ED`,
        'Start time must be after the earlier session start time',
      )
    })
  })

  it('should pass validation if evening start is before the afternoon start time but days do no match', async () => {
    const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
    const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

    const startTime = new SimpleTime()
    startTime.hour = 13
    startTime.minute = 30

    startMap.set('FRIDAY-PM', startTime)

    const endTime = new SimpleTime()
    endTime.hour = 15
    endTime.minute = 30

    endMap.set('FRIDAY-PM', endTime)

    const startTime2 = new SimpleTime()
    startTime2.hour = 9
    startTime2.minute = 30

    startMap.set('SATURDAY-ED', startTime2)

    const endTime2 = new SimpleTime()
    endTime2.hour = 21
    endTime2.minute = 15

    endMap.set('SATURDAY-ED', endTime2)

    req.body = {
      startTimes: startMap,
      endTimes: endMap,
    }

    await handler.POST(req, res)

    expect(res.addValidationError).toBeCalledTimes(0)
  })
})
