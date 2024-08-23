import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import SessionTimesRoutes, { SessionTimes } from './sessionTimes'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonRegime } from '../../../../@types/activitiesAPI/types'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import TimeSlot from '../../../../enum/timeSlot'
import { associateErrorsWithProperty } from '../../../../utils/utils'

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
      redirectOrReturnWithSuccess: jest.fn(),
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
        },
      },
      params: {},
    } as unknown as Request

    activitiesService.getPrisonRegime.mockReturnValue(Promise.resolve(prisonRegime))
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/session-times', {
        regimeTimes: [
          { amFinish: '11:45', amStart: '08:30', dayOfWeek: 'TUESDAY' },
          { dayOfWeek: 'FRIDAY', edFinish: '19:15', edStart: '17:30', pmFinish: '16:45', pmStart: '13:45' },
        ],
        sessionSlots: [
          {
            dayOfWeek: 'TUESDAY',
            timeSlot: 'AM',
            start: '08:30',
            finish: '11:45',
          },
          {
            dayOfWeek: 'FRIDAY',
            timeSlot: 'PM',
            start: '13:45',
            finish: '16:45',
          },
          {
            dayOfWeek: 'FRIDAY',
            timeSlot: 'ED',
            start: '17:30',
            finish: '19:15',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('when using custom times redirect to the bank holiday page', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 5
      startTime.minute = 30

      startMap.set('MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 9
      endTime.minute = 44

      endMap.set('MONDAY-AM', endTime)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

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

      expect(res.redirectOrReturn).toHaveBeenCalledWith('bank-holiday-option')
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

      startMap.set('MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 9
      endTime.minute = 44

      endMap.set('MONDAY-AM', endTime)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `endTimes-MONDAY-AM`,
        'Select an end time after the start time',
      )
    })

    it('should fail validation if end time is the same as start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 10
      endTime.minute = 30

      endMap.set('MONDAY-AM', endTime)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `endTimes-MONDAY-AM`,
        'Select an end time after the start time',
      )
    })

    it('should fail validation if afternoon start is before the morning start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('FRIDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 30

      endMap.set('FRIDAY-AM', endTime)

      const startTime2 = new SimpleTime()
      startTime2.hour = 9
      startTime2.minute = 30

      startMap.set('FRIDAY-PM', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('FRIDAY-PM', endTime2)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-FRIDAY-PM`,
        'Start time must be after the earlier session start time',
      )
    })

    it('should fail validation if evening start is before the morning start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 30

      startMap.set('FRIDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 30

      endMap.set('FRIDAY-AM', endTime)

      const startTime2 = new SimpleTime()
      startTime2.hour = 9
      startTime2.minute = 30

      startMap.set('FRIDAY-ED', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('FRIDAY-ED', endTime2)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-FRIDAY-ED`,
        'Start time must be after the earlier session start time',
      )
    })

    it('should fail validation if evening start is before the afternoon start time', async () => {
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

      startMap.set('FRIDAY-ED', startTime2)

      const endTime2 = new SimpleTime()
      endTime2.hour = 21
      endTime2.minute = 15

      endMap.set('FRIDAY-ED', endTime2)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-FRIDAY-ED`,
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
