import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RegimeChangeRoutes, { getPrisonRegimes, RegimeTimes } from './regimeChange'
import ActivitiesService from '../../../../services/activitiesService'
import { PrisonRegime } from '../../../../@types/activitiesAPI/types'
import { DaysAndSlotsInRegime } from '../../../../utils/helpers/applicableRegimeTimeUtil'
import TimeSlot from '../../../../enum/timeSlot'
import { DayOfWeekEnum, SessionSlot } from '../../../../utils/helpers/activityTimeSlotMappers'
import SimpleTime from '../../../../commonValidationTypes/simpleTime'
import atLeast from '../../../../../jest.setup'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const regimeTimes: PrisonRegime[] = [
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

const expectedRegimeTimes: PrisonRegime[] = [
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:21',
    amFinish: '11:37',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:43',
    edFinish: '19:00',
    dayOfWeek: 'MONDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:25',
    amFinish: '11:35',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:08',
    edFinish: '20:09',
    dayOfWeek: 'TUESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:25',
    amFinish: '11:35',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:08',
    edFinish: '20:09',
    dayOfWeek: 'WEDNESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:25',
    amFinish: '11:35',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:08',
    edFinish: '20:09',
    dayOfWeek: 'THURSDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:25',
    amFinish: '11:35',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:08',
    edFinish: '20:09',
    dayOfWeek: 'FRIDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:25',
    amFinish: '11:35',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:08',
    edFinish: '20:09',
    dayOfWeek: 'SATURDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:25',
    amFinish: '11:35',
    pmStart: '13:30',
    pmFinish: '14:45',
    edStart: '18:08',
    edFinish: '20:09',
    dayOfWeek: 'SUNDAY',
  },
]

describe('Route Handlers - Change Regime times', () => {
  const handler = new RegimeChangeRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'RSI',
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
      params: {},
    } as unknown as Request

    activitiesService.getPrisonRegime.mockReturnValue(Promise.resolve(regimeTimes))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render regime change page', async () => {
      const regimeSchedule: Map<string, DaysAndSlotsInRegime[] | SessionSlot[]> = new Map<
        string,
        DaysAndSlotsInRegime[] | SessionSlot[]
      >()
      regimeSchedule.set('prisonRegimeTimes', [
        {
          dayOfWeek: DayOfWeekEnum.MONDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.MONDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.MONDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
        {
          dayOfWeek: DayOfWeekEnum.TUESDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.TUESDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.TUESDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
        {
          dayOfWeek: DayOfWeekEnum.WEDNESDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.WEDNESDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.WEDNESDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
        {
          dayOfWeek: DayOfWeekEnum.THURSDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.THURSDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.THURSDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
        {
          dayOfWeek: DayOfWeekEnum.FRIDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.FRIDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.FRIDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
        {
          dayOfWeek: DayOfWeekEnum.SATURDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.SATURDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.SATURDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
        {
          dayOfWeek: DayOfWeekEnum.SUNDAY,
          timeSlot: TimeSlot.AM,
          start: '08:30',
          finish: '11:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.SUNDAY,
          timeSlot: TimeSlot.PM,
          start: '13:45',
          finish: '16:45',
        },
        {
          dayOfWeek: DayOfWeekEnum.SUNDAY,
          timeSlot: TimeSlot.ED,
          start: '17:30',
          finish: '19:15',
        },
      ])
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/administration/regime-times', {
        regimeTimes,
        regimeSlots: regimeSchedule,
      })
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 9
      startTime.minute = 21
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 13
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 18
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 18
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }
    })
    it('should call the API regime update endpoint', async () => {
      const prisonCaseload = 'RSI'

      when(activitiesService.updatePrisonRegime).calledWith(atLeast(expectedRegimeTimes))

      await handler.POST(req, res)
      expect(activitiesService.updatePrisonRegime).toHaveBeenCalledWith(
        expectedRegimeTimes,
        prisonCaseload,
        res.locals.user,
      )
    })

    it('should map prison regime successfully', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 9
      startTime.minute = 21
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 13
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 18
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 18
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      const updatedRegimeTimes = getPrisonRegimes(startMap, endMap, regimeTimes)

      expect(updatedRegimeTimes).toEqual(expectedRegimeTimes)
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

      const requestObject = plainToInstance(RegimeTimes, body)
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

      const requestObject = plainToInstance(RegimeTimes, body)
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

      const requestObject = plainToInstance(RegimeTimes, body)
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

      const requestObject = plainToInstance(RegimeTimes, body)
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

      const requestObject = plainToInstance(RegimeTimes, body)
      const errors = await validate(requestObject).then(errs =>
        errs[0].children[0].children.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select a minute', property: 'minute' }]))
    })

    it('should fail validation if end time is before start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 12
      startTime.minute = 21
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 13
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 18
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 18
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `endTimes-prisonRegimeTimes-MONDAY-AM`,
        'Select an end time after the start time',
      )
    })

    it('should fail validation if end time is the same as start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 11
      startTime.minute = 37
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 13
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 18
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 18
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `endTimes-prisonRegimeTimes-MONDAY-AM`,
        'Select an end time after the start time',
      )
    })

    it('should fail validation if afternoon start is before the morning start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 11
      startTime.minute = 37
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 10
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 18
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 18
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-prisonRegimeTimes-MONDAY-AM`,
        'Check start times for this day. Start time must be before the earlier session start time',
      )
    })

    it('should fail validation if evening start is before the morning start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 37
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 13
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 8
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 18
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }
      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-prisonRegimeTimes-FRIDAY-AM`,
        'Check start times for this day. Start time must be before the earlier session start time',
      )
    })

    it('should fail validation if evening start is before the afternoon start time', async () => {
      const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
      // MONDAY
      const startTime = new SimpleTime()
      startTime.hour = 10
      startTime.minute = 37
      startMap.set('prisonRegimeTimes-MONDAY-AM', startTime)

      const endTime = new SimpleTime()
      endTime.hour = 11
      endTime.minute = 37
      endMap.set('prisonRegimeTimes-MONDAY-AM', endTime)

      const startTimePM = new SimpleTime()
      startTimePM.hour = 13
      startTimePM.minute = 30
      startMap.set('prisonRegimeTimes-MONDAY-PM', startTimePM)

      const endTimePM = new SimpleTime()
      endTimePM.hour = 14
      endTimePM.minute = 45
      endMap.set('prisonRegimeTimes-MONDAY-PM', endTimePM)

      const startTimeEd = new SimpleTime()
      startTimeEd.hour = 18
      startTimeEd.minute = 43
      startMap.set('prisonRegimeTimes-MONDAY-ED', startTimeEd)

      const endTimeEd = new SimpleTime()
      endTimeEd.hour = 19
      endTimeEd.minute = 0
      endMap.set('prisonRegimeTimes-MONDAY-ED', endTimeEd)

      // TUESDAY
      const startTimeTuesAM = new SimpleTime()
      startTimeTuesAM.hour = 9
      startTimeTuesAM.minute = 25
      startMap.set('prisonRegimeTimes-TUESDAY-AM', startTimeTuesAM)

      const endTimeTuesAM = new SimpleTime()
      endTimeTuesAM.hour = 11
      endTimeTuesAM.minute = 35
      endMap.set('prisonRegimeTimes-TUESDAY-AM', endTimeTuesAM)

      const startTimeTuesPM = new SimpleTime()
      startTimeTuesPM.hour = 13
      startTimeTuesPM.minute = 30
      startMap.set('prisonRegimeTimes-TUESDAY-PM', startTimeTuesPM)

      const endTimeTuesPM = new SimpleTime()
      endTimeTuesPM.hour = 14
      endTimeTuesPM.minute = 45
      endMap.set('prisonRegimeTimes-TUESDAY-PM', endTimeTuesPM)

      const startTimeTuesEd = new SimpleTime()
      startTimeTuesEd.hour = 18
      startTimeTuesEd.minute = 8
      startMap.set('prisonRegimeTimes-TUESDAY-ED', startTimeTuesEd)

      const endTimeTuesEd = new SimpleTime()
      endTimeTuesEd.hour = 20
      endTimeTuesEd.minute = 9
      endMap.set('prisonRegimeTimes-TUESDAY-ED', endTimeTuesEd)

      // WEDNESDAY
      const startTimeWedsAM = new SimpleTime()
      startTimeWedsAM.hour = 9
      startTimeWedsAM.minute = 25
      startMap.set('prisonRegimeTimes-WEDNESDAY-AM', startTimeWedsAM)

      const endTimeWedsAM = new SimpleTime()
      endTimeWedsAM.hour = 11
      endTimeWedsAM.minute = 35
      endMap.set('prisonRegimeTimes-WEDNESDAY-AM', endTimeWedsAM)

      const startTimeWedsPM = new SimpleTime()
      startTimeWedsPM.hour = 13
      startTimeWedsPM.minute = 30
      startMap.set('prisonRegimeTimes-WEDNESDAY-PM', startTimeWedsPM)

      const endTimeWedsPM = new SimpleTime()
      endTimeWedsPM.hour = 14
      endTimeWedsPM.minute = 45
      endMap.set('prisonRegimeTimes-WEDNESDAY-PM', endTimeWedsPM)

      const startTimeWedsEd = new SimpleTime()
      startTimeWedsEd.hour = 18
      startTimeWedsEd.minute = 8
      startMap.set('prisonRegimeTimes-WEDNESDAY-ED', startTimeWedsEd)

      const endTimeWedsEd = new SimpleTime()
      endTimeWedsEd.hour = 20
      endTimeWedsEd.minute = 9
      endMap.set('prisonRegimeTimes-WEDNESDAY-ED', endTimeWedsEd)

      // THURSDAY
      const startTimeThursAM = new SimpleTime()
      startTimeThursAM.hour = 9
      startTimeThursAM.minute = 25
      startMap.set('prisonRegimeTimes-THURSDAY-AM', startTimeThursAM)

      const endTimeThursAM = new SimpleTime()
      endTimeThursAM.hour = 11
      endTimeThursAM.minute = 35
      endMap.set('prisonRegimeTimes-THURSDAY-AM', endTimeThursAM)

      const startTimeThursPM = new SimpleTime()
      startTimeThursPM.hour = 13
      startTimeThursPM.minute = 30
      startMap.set('prisonRegimeTimes-THURSDAY-PM', startTimeThursPM)

      const endTimeThursPM = new SimpleTime()
      endTimeThursPM.hour = 14
      endTimeThursPM.minute = 45
      endMap.set('prisonRegimeTimes-THURSDAY-PM', endTimeThursPM)

      const startTimeThursEd = new SimpleTime()
      startTimeThursEd.hour = 18
      startTimeThursEd.minute = 8
      startMap.set('prisonRegimeTimes-THURSDAY-ED', startTimeThursEd)

      const endTimeThursEd = new SimpleTime()
      endTimeThursEd.hour = 20
      endTimeThursEd.minute = 9
      endMap.set('prisonRegimeTimes-THURSDAY-ED', endTimeThursEd)

      // FRIDAY
      const startTimeFriAM = new SimpleTime()
      startTimeFriAM.hour = 9
      startTimeFriAM.minute = 25
      startMap.set('prisonRegimeTimes-FRIDAY-AM', startTimeFriAM)

      const endTimeFriAM = new SimpleTime()
      endTimeFriAM.hour = 11
      endTimeFriAM.minute = 35
      endMap.set('prisonRegimeTimes-FRIDAY-AM', endTimeFriAM)

      const startTimeFriPM = new SimpleTime()
      startTimeFriPM.hour = 13
      startTimeFriPM.minute = 30
      startMap.set('prisonRegimeTimes-FRIDAY-PM', startTimeFriPM)

      const endTimeFriPM = new SimpleTime()
      endTimeFriPM.hour = 14
      endTimeFriPM.minute = 45
      endMap.set('prisonRegimeTimes-FRIDAY-PM', endTimeFriPM)

      const startTimeFriEd = new SimpleTime()
      startTimeFriEd.hour = 17
      startTimeFriEd.minute = 8
      startMap.set('prisonRegimeTimes-FRIDAY-ED', startTimeFriEd)

      const endTimeFriEd = new SimpleTime()
      endTimeFriEd.hour = 20
      endTimeFriEd.minute = 9
      endMap.set('prisonRegimeTimes-FRIDAY-ED', endTimeFriEd)

      // SATURDAY
      const startTimeSatAM = new SimpleTime()
      startTimeSatAM.hour = 9
      startTimeSatAM.minute = 25
      startMap.set('prisonRegimeTimes-SATURDAY-AM', startTimeSatAM)

      const endTimeSatAM = new SimpleTime()
      endTimeSatAM.hour = 11
      endTimeSatAM.minute = 35
      endMap.set('prisonRegimeTimes-SATURDAY-AM', endTimeSatAM)

      const startTimeSatPM = new SimpleTime()
      startTimeSatPM.hour = 13
      startTimeSatPM.minute = 30
      startMap.set('prisonRegimeTimes-SATURDAY-PM', startTimeSatPM)

      const endTimeSatPM = new SimpleTime()
      endTimeSatPM.hour = 14
      endTimeSatPM.minute = 45
      endMap.set('prisonRegimeTimes-SATURDAY-PM', endTimeSatPM)

      const startTimeSatEd = new SimpleTime()
      startTimeSatEd.hour = 18
      startTimeSatEd.minute = 8
      startMap.set('prisonRegimeTimes-SATURDAY-ED', startTimeSatEd)

      const endTimeSatEd = new SimpleTime()
      endTimeSatEd.hour = 20
      endTimeSatEd.minute = 9
      endMap.set('prisonRegimeTimes-SATURDAY-ED', endTimeSatEd)

      // SUNDAY
      const startTimeSunAM = new SimpleTime()
      startTimeSunAM.hour = 9
      startTimeSunAM.minute = 25
      startMap.set('prisonRegimeTimes-SUNDAY-AM', startTimeSunAM)

      const endTimeSunAM = new SimpleTime()
      endTimeSunAM.hour = 11
      endTimeSunAM.minute = 35
      endMap.set('prisonRegimeTimes-SUNDAY-AM', endTimeSunAM)

      const startTimeSunPM = new SimpleTime()
      startTimeSunPM.hour = 13
      startTimeSunPM.minute = 30
      startMap.set('prisonRegimeTimes-SUNDAY-PM', startTimeSunPM)

      const endTimeSunPM = new SimpleTime()
      endTimeSunPM.hour = 14
      endTimeSunPM.minute = 45
      endMap.set('prisonRegimeTimes-SUNDAY-PM', endTimeSunPM)

      const startTimeSunEd = new SimpleTime()
      startTimeSunEd.hour = 12
      startTimeSunEd.minute = 8
      startMap.set('prisonRegimeTimes-SUNDAY-ED', startTimeSunEd)

      const endTimeSunEd = new SimpleTime()
      endTimeSunEd.hour = 20
      endTimeSunEd.minute = 9
      endMap.set('prisonRegimeTimes-SUNDAY-ED', endTimeSunEd)

      req.body = {
        startTimes: startMap,
        endTimes: endMap,
      }

      await handler.POST(req, res)

      expect(res.addValidationError).toHaveBeenCalledWith(
        `startTimes-prisonRegimeTimes-SUNDAY-AM`,
        'Check start times for this day. Start time must be before the earlier session start time',
      )
    })
  })
})
