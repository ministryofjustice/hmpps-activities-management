import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RegimeChangeRoutes, { RegimeTimes } from './regimeChange'
import ActivitiesService from '../../../../services/activitiesService'
import { Activity, ActivitySummary, PrisonRegime, Slot } from '../../../../@types/activitiesAPI/types'
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
        createMode: false,
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

    it('should update the prison regime and filter out activities not live or activities not using the prison regime times successfully', async () => {
      const prisonCaseload = 'RSI'

      when(activitiesService.updatePrisonRegime).calledWith(atLeast(expectedRegimeTimes))

      const activitySummary1: ActivitySummary = {
        id: 401,
        activityName: 'Admin Orderly',
        category: {
          id: 3,
          code: 'SAA_PRISON_JOBS',
          name: 'Prison jobs',
          description:
            'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
        },
        capacity: 2,
        allocated: 1,
        waitlisted: 0,
        createdTime: '2023-10-23T09:52:30',
        activityState: 'LIVE',
      }
      const activitySummary2: ActivitySummary = {
        id: 872,
        activityName: 'AP test activity 3',
        category: {
          id: 5,
          code: 'SAA_INDUCTION',
          name: 'Induction',
          description: 'Such as gym induction, education assessments or health and safety workshops',
        },
        capacity: 6,
        allocated: 0,
        waitlisted: 0,
        createdTime: '2024-08-22T09:15:54',
        activityState: 'LIVE',
      }
      const activitySummary3: ActivitySummary = {
        id: 539,
        activityName: 'A Wing Cleaner 2',
        category: {
          id: 3,
          code: 'SAA_PRISON_JOBS',
          name: 'Prison jobs',
          description:
            'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
        },
        capacity: 8,
        allocated: 1,
        waitlisted: 0,
        createdTime: '2023-10-23T09:59:24',
        activityState: 'LIVE',
      }
      const archivedActivitySummary: ActivitySummary = {
        id: 222,
        activityName: 'A Wing Cleaner 2',
        category: {
          id: 3,
          code: 'SAA_PRISON_JOBS',
          name: 'Prison jobs',
          description:
            'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
        },
        capacity: 8,
        allocated: 1,
        waitlisted: 0,
        createdTime: '2023-10-23T09:59:24',
        activityState: 'ARCHIVED',
      }

      const activity1: Activity = {
        id: 401,
        prisonCode: 'RSI',
        attendanceRequired: true,
        inCell: false,
        onWing: false,
        offWing: false,
        pieceWork: false,
        outsideWork: false,
        payPerSession: 'H',
        summary: 'Admin Orderly',
        description: 'Admin Orderly',
        category: {
          id: 3,
          code: 'SAA_PRISON_JOBS',
          name: 'Prison jobs',
          description:
            'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
        },
        tier: {
          id: 2,
          code: 'TIER_2',
          description: 'Tier 2',
        },
        organiser: {
          id: 1,
          code: 'PRISON_STAFF',
          description: 'Prison staff',
        },
        eligibilityRules: [],
        schedules: [
          {
            id: 385,
            instances: [
              {
                id: 166864,
                date: '2024-10-10',
                startTime: '08:30',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [
                  {
                    id: 104186,
                    scheduleInstanceId: 166864,
                    prisonerNumber: 'G8622GR',
                    attendanceReason: null,
                    comment: null,
                    recordedTime: null,
                    recordedBy: null,
                    status: 'WAITING',
                    payAmount: 195,
                    bonusAmount: null,
                    pieces: null,
                    issuePayment: null,
                    incentiveLevelWarningIssued: null,
                    otherAbsenceReason: null,
                    caseNoteText: null,
                    attendanceHistory: [],
                    editable: false,
                    payable: true,
                  },
                ],
              },
              {
                id: 166865,
                date: '2024-10-10',
                startTime: '13:30',
                endTime: '16:30',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [
                  {
                    id: 105426,
                    scheduleInstanceId: 166865,
                    prisonerNumber: 'G8622GR',
                    attendanceReason: null,
                    comment: null,
                    recordedTime: null,
                    recordedBy: null,
                    status: 'WAITING',
                    payAmount: 195,
                    bonusAmount: null,
                    pieces: null,
                    issuePayment: null,
                    incentiveLevelWarningIssued: null,
                    otherAbsenceReason: null,
                    caseNoteText: null,
                    attendanceHistory: [],
                    editable: false,
                    payable: true,
                  },
                ],
              },
              {
                id: 10964,
                date: '2024-10-21',
                startTime: '04:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10965,
                date: '2024-10-28',
                startTime: '04:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10966,
                date: '2024-11-01',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10967,
                date: '2024-11-01',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9282,
                date: '2024-10-16',
                startTime: '08:30',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9283,
                date: '2024-10-16',
                startTime: '13:30',
                endTime: '16:30',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9957,
                date: '2024-10-17',
                startTime: '05:10',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9958,
                date: '2024-10-17',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9960,
                date: '2024-10-18',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9964,
                date: '2024-10-22',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9966,
                date: '2024-10-23',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9968,
                date: '2024-10-24',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9970,
                date: '2024-10-25',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9974,
                date: '2024-10-29',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 9976,
                date: '2024-10-30',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10014,
                date: '2024-10-18',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10016,
                date: '2024-10-21',
                startTime: '13:35',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10017,
                date: '2024-10-22',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10018,
                date: '2024-10-23',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10019,
                date: '2024-10-24',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10020,
                date: '2024-10-25',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10022,
                date: '2024-10-28',
                startTime: '13:35',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10023,
                date: '2024-10-29',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10024,
                date: '2024-10-30',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10025,
                date: '2024-10-31',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10026,
                date: '2024-10-31',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
            ],
            allocations: [
              {
                id: 7153,
                prisonerNumber: 'G8622GR',
                bookingId: 1211200,
                activitySummary: 'Admin Orderly',
                activityId: 401,
                scheduleId: 385,
                scheduleDescription: 'Admin Orderly',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2024-09-10',
                endDate: null,
                allocatedTime: '2024-09-10T09:23:00',
                allocatedBy: 'SHARRISON_GEN',
                deallocatedTime: null,
                deallocatedBy: null,
                deallocatedReason: null,
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ACTIVE',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
            ],
            description: 'Admin Orderly',
            suspensions: [],
            internalLocation: {
              id: 67907,
              code: 'OTHER',
              description: 'RSI-OTHER-OTHER',
            },
            capacity: 2,
            activity: {
              id: 401,
              prisonCode: 'RSI',
              attendanceRequired: true,
              inCell: false,
              onWing: false,
              offWing: false,
              pieceWork: false,
              outsideWork: false,
              payPerSession: 'H',
              summary: 'Admin Orderly',
              description: 'Admin Orderly',
              category: {
                id: 3,
                code: 'SAA_PRISON_JOBS',
                name: 'Prison jobs',
                description:
                  'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
              },
              riskLevel: 'low',
              minimumEducationLevel: [],
              endDate: null,
              capacity: 2,
              allocated: 1,
              createdTime: '2023-10-23T09:52:30',
              activityState: 'LIVE',
              paid: true,
            },
            scheduleWeeks: 1,
            slots: [
              {
                id: 100738,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Tue'],
                mondayFlag: false,
                tuesdayFlag: true,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100739,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:10',
                endTime: '16:45',
                daysOfWeek: ['Tue'],
                mondayFlag: false,
                tuesdayFlag: true,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100740,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100741,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100742,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Thu'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: true,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100743,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Thu'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: true,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100744,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100745,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100746,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100747,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100748,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Tue'],
                mondayFlag: false,
                tuesdayFlag: true,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100749,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '04:15',
                endTime: '11:45',
                daysOfWeek: ['Mon'],
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100750,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Thu'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: true,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100751,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100752,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100753,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:10',
                endTime: '16:45',
                daysOfWeek: ['Tue'],
                mondayFlag: false,
                tuesdayFlag: true,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100754,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:35',
                endTime: '16:45',
                daysOfWeek: ['Mon'],
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100755,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Thu'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: true,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
            ],
            startDate: '2023-10-24',
            endDate: null,
            runsOnBankHoliday: true,
            updatedTime: '2024-10-18T09:18:56',
            updatedBy: 'DHOUSTON_GEN',
            usePrisonRegimeTime: true,
          },
        ],
        pay: [
          {
            id: 2396,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            prisonPayBand: {
              id: 313,
              displaySequence: 10,
              alias: 'Pay band 10 (Highest)',
              description: 'Pay band 10 (Highest)',
              nomisPayBand: 10,
              prisonCode: 'LHI',
            },
            rate: 55,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 2397,
            incentiveNomisCode: 'ENH',
            incentiveLevel: 'Enhanced',
            prisonPayBand: {
              id: 313,
              displaySequence: 10,
              alias: 'Pay band 10 (Highest)',
              description: 'Pay band 10 (Highest)',
              nomisPayBand: 10,
              prisonCode: 'LHI',
            },
            rate: 175,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 2405,
            incentiveNomisCode: 'STD',
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 313,
              displaySequence: 10,
              alias: 'Pay band 10 (Highest)',
              description: 'Pay band 10 (Highest)',
              nomisPayBand: 10,
              prisonCode: 'LHI',
            },
            rate: 55,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 2402,
            incentiveNomisCode: 'ENH',
            incentiveLevel: 'Enhanced',
            prisonPayBand: {
              id: 314,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'HMI',
            },
            rate: 195,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 2408,
            incentiveNomisCode: 'STD',
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 314,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'HMI',
            },
            rate: 195,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
        ],
        startDate: '2023-10-24',
        endDate: null,
        riskLevel: 'low',
        createdTime: '2023-10-23T09:52:30',
        createdBy: 'MIGRATION',
        updatedTime: '2024-10-18T09:18:56',
        updatedBy: 'DHOUSTON_GEN',
        minimumEducationLevel: [],
        paid: true,
      }
      const activity2: Activity = {
        id: 539,
        prisonCode: 'RSI',
        attendanceRequired: true,
        inCell: false,
        onWing: false,
        offWing: false,
        pieceWork: false,
        outsideWork: false,
        payPerSession: 'H',
        summary: 'A Wing Cleaner 2',
        description: 'A Wing Cleaner 2',
        category: {
          id: 3,
          code: 'SAA_PRISON_JOBS',
          name: 'Prison jobs',
          description:
            'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
        },
        tier: {
          id: 1,
          code: 'TIER_1',
          description: 'Tier 1',
        },
        organiser: null,
        eligibilityRules: [],
        schedules: [
          {
            id: 518,
            instances: [
              {
                id: 166684,
                date: '2024-10-10',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [
                  {
                    id: 105370,
                    scheduleInstanceId: 166684,
                    prisonerNumber: 'G0995GW',
                    attendanceReason: {
                      id: 7,
                      code: 'SUSPENDED',
                      description: 'Suspended',
                      attended: false,
                      capturePay: false,
                      captureMoreDetail: false,
                      captureCaseNote: false,
                      captureIncentiveLevelWarning: false,
                      captureOtherText: false,
                      displayInAbsence: false,
                      displaySequence: null,
                      notes: 'Maps to ACCAB in NOMIS',
                    },
                    comment: null,
                    recordedTime: '2024-10-15T14:54:09',
                    recordedBy: 'Activities Management Service',
                    status: 'COMPLETED',
                    payAmount: 62,
                    bonusAmount: null,
                    pieces: null,
                    issuePayment: false,
                    incentiveLevelWarningIssued: null,
                    otherAbsenceReason: null,
                    caseNoteText: null,
                    attendanceHistory: [],
                    editable: false,
                    payable: true,
                  },
                ],
              },
              {
                id: 10968,
                date: '2024-10-21',
                startTime: '04:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10969,
                date: '2024-10-28',
                startTime: '04:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10970,
                date: '2024-11-01',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2846,
                date: '2024-10-16',
                startTime: '08:30',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2847,
                date: '2024-10-16',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2848,
                date: '2024-10-16',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2849,
                date: '2024-10-17',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2851,
                date: '2024-10-18',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2863,
                date: '2024-10-23',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2864,
                date: '2024-10-23',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2865,
                date: '2024-10-24',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2867,
                date: '2024-10-25',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2879,
                date: '2024-10-30',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2880,
                date: '2024-10-30',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2881,
                date: '2024-10-31',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2883,
                date: '2024-11-01',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2895,
                date: '2024-11-06',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2896,
                date: '2024-11-06',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2897,
                date: '2024-11-07',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2899,
                date: '2024-11-08',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2911,
                date: '2024-11-13',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2912,
                date: '2024-11-13',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2913,
                date: '2024-11-14',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2915,
                date: '2024-11-15',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2927,
                date: '2024-11-20',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2928,
                date: '2024-11-20',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2929,
                date: '2024-11-21',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2931,
                date: '2024-11-22',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2943,
                date: '2024-11-27',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2944,
                date: '2024-11-27',
                startTime: '17:30',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2945,
                date: '2024-11-28',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 2947,
                date: '2024-11-29',
                startTime: '13:45',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10027,
                date: '2024-10-18',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10028,
                date: '2024-10-19',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10029,
                date: '2024-10-19',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10030,
                date: '2024-10-20',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10031,
                date: '2024-10-20',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10032,
                date: '2024-10-20',
                startTime: '17:35',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10034,
                date: '2024-10-21',
                startTime: '13:35',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10035,
                date: '2024-10-21',
                startTime: '17:35',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10036,
                date: '2024-10-22',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10037,
                date: '2024-10-22',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10038,
                date: '2024-10-23',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10039,
                date: '2024-10-25',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10040,
                date: '2024-10-26',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10041,
                date: '2024-10-26',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10042,
                date: '2024-10-27',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10043,
                date: '2024-10-27',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10044,
                date: '2024-10-27',
                startTime: '17:35',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10046,
                date: '2024-10-28',
                startTime: '13:35',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10047,
                date: '2024-10-28',
                startTime: '17:35',
                endTime: '19:15',
                timeSlot: 'ED',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10048,
                date: '2024-10-29',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10049,
                date: '2024-10-29',
                startTime: '13:10',
                endTime: '16:45',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 10050,
                date: '2024-10-30',
                startTime: '03:15',
                endTime: '11:45',
                timeSlot: 'AM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
            ],
            allocations: [
              {
                id: 7094,
                prisonerNumber: 'G5633GC',
                bookingId: 987624,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 313,
                  displaySequence: 10,
                  alias: 'Pay band 10 (Highest)',
                  description: 'Pay band 10 (Highest)',
                  nomisPayBand: 10,
                  prisonCode: 'LHI',
                },
                startDate: '2024-06-19',
                endDate: '2024-06-18',
                allocatedTime: '2024-06-18T12:12:00',
                allocatedBy: 'SHARRISON_GEN',
                deallocatedTime: '2024-06-18T21:30:45',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'TEMPORARILY_RELEASED',
                  description: 'Temporarily released or transferred',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 7071,
                prisonerNumber: 'A1145EA',
                bookingId: 1214384,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 313,
                  displaySequence: 10,
                  alias: 'Pay band 10 (Highest)',
                  description: 'Pay band 10 (Highest)',
                  nomisPayBand: 10,
                  prisonCode: 'LHI',
                },
                startDate: '2024-05-10',
                endDate: '2024-05-09',
                allocatedTime: '2024-05-09T11:59:00',
                allocatedBy: 'SCH_ACTIVITY',
                deallocatedTime: '2024-05-09T16:39:32',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'RELEASED',
                  description: 'Released from prison',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 6999,
                prisonerNumber: 'G3757GX',
                bookingId: 1001905,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 313,
                  displaySequence: 10,
                  alias: 'Pay band 10 (Highest)',
                  description: 'Pay band 10 (Highest)',
                  nomisPayBand: 10,
                  prisonCode: 'LHI',
                },
                startDate: '2024-03-05',
                endDate: '2024-03-06',
                allocatedTime: '2024-03-04T12:28:00',
                allocatedBy: 'SHARRISON_GEN',
                deallocatedTime: '2024-03-06T11:46:54',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'OTHER',
                  description: 'Other',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 6991,
                prisonerNumber: 'G6268GL',
                bookingId: 935073,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2024-02-26',
                endDate: '2024-02-20',
                allocatedTime: '2024-02-20T10:37:00',
                allocatedBy: 'SMCVEIGH_GEN',
                deallocatedTime: '2024-02-20T21:30:13',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'TEMPORARILY_RELEASED',
                  description: 'Temporarily released or transferred',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 7081,
                prisonerNumber: 'G6268GL',
                bookingId: 935073,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2024-07-01',
                endDate: '2024-06-04',
                allocatedTime: '2024-06-04T14:31:00',
                allocatedBy: 'SHARRISON_GEN',
                deallocatedTime: '2024-06-04T21:30:17',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'TEMPORARILY_RELEASED',
                  description: 'Temporarily released or transferred',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 7083,
                prisonerNumber: 'G6268GL',
                bookingId: 935073,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2024-06-06',
                endDate: '2024-06-05',
                allocatedTime: '2024-06-05T16:00:00',
                allocatedBy: 'TWRIGHT',
                deallocatedTime: '2024-06-05T21:30:17',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'TEMPORARILY_RELEASED',
                  description: 'Temporarily released or transferred',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 4188,
                prisonerNumber: 'G0995GW',
                bookingId: 1068066,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2023-10-24',
                endDate: null,
                allocatedTime: '2023-10-23T10:00:00',
                allocatedBy: 'MIGRATION',
                deallocatedTime: null,
                deallocatedBy: null,
                deallocatedReason: null,
                suspendedTime: '2024-03-27T12:38:43',
                suspendedBy: 'SMCVEIGH_GEN',
                suspendedReason: 'Planned suspension',
                status: 'SUSPENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 3325,
                prisonerNumber: 'G7348UO',
                bookingId: 1125566,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2023-10-24',
                endDate: '2024-03-26',
                allocatedTime: '2023-10-23T10:00:00',
                allocatedBy: 'MIGRATION',
                deallocatedTime: '2024-03-26T11:12:24',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'OTHER',
                  description: 'Other',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 4486,
                prisonerNumber: 'G0837GP',
                bookingId: 670828,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2023-10-24',
                endDate: '2024-03-26',
                allocatedTime: '2023-10-23T10:00:00',
                allocatedBy: 'MIGRATION',
                deallocatedTime: '2024-03-26T10:24:32',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'OTHER',
                  description: 'Other',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 3234,
                prisonerNumber: 'G6416GK',
                bookingId: 1041931,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 314,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'HMI',
                },
                startDate: '2023-10-24',
                endDate: '2024-03-26',
                allocatedTime: '2023-10-23T09:59:00',
                allocatedBy: 'MIGRATION',
                deallocatedTime: '2024-03-26T11:59:16',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'OTHER',
                  description: 'Other',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
              {
                id: 7092,
                prisonerNumber: 'G6268GL',
                bookingId: 935073,
                activitySummary: 'A Wing Cleaner 2',
                activityId: 539,
                scheduleId: 518,
                scheduleDescription: 'A Wing Cleaner 2',
                isUnemployment: false,
                prisonPayBand: {
                  id: 319,
                  displaySequence: 6,
                  alias: 'Pay band 6',
                  description: 'Pay band 6',
                  nomisPayBand: 6,
                  prisonCode: 'HMI',
                },
                startDate: '2024-06-18',
                endDate: '2024-06-17',
                allocatedTime: '2024-06-17T12:45:00',
                allocatedBy: 'SCH_ACTIVITY',
                deallocatedTime: '2024-06-17T21:30:16',
                deallocatedBy: 'Activities Management Service',
                deallocatedReason: {
                  code: 'TEMPORARILY_RELEASED',
                  description: 'Temporarily released or transferred',
                },
                suspendedTime: null,
                suspendedBy: null,
                suspendedReason: null,
                status: 'ENDED',
                plannedDeallocation: null,
                plannedSuspension: null,
                exclusions: [],
                prisonerName: null,
                prisonerStatus: null,
                prisonerPrisonCode: null,
                cellLocation: null,
                earliestReleaseDate: null,
              },
            ],
            description: 'A Wing Cleaner 2',
            suspensions: [],
            internalLocation: {
              id: 67128,
              code: 'AWING',
              description: 'A WING',
            },
            capacity: 8,
            activity: {
              id: 539,
              prisonCode: 'RSI',
              attendanceRequired: true,
              inCell: false,
              onWing: false,
              offWing: false,
              pieceWork: false,
              outsideWork: false,
              payPerSession: 'H',
              summary: 'A Wing Cleaner 2',
              description: 'A Wing Cleaner 2',
              category: {
                id: 3,
                code: 'SAA_PRISON_JOBS',
                name: 'Prison jobs',
                description:
                  'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
              },
              riskLevel: 'medium',
              minimumEducationLevel: [],
              endDate: '2026-10-05',
              capacity: 8,
              allocated: 1,
              createdTime: '2023-10-23T09:59:24',
              activityState: 'LIVE',
              paid: true,
            },
            scheduleWeeks: 1,
            slots: [
              {
                id: 100756,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100757,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100758,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '04:15',
                endTime: '11:45',
                daysOfWeek: ['Mon'],
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100759,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Tue'],
                mondayFlag: false,
                tuesdayFlag: true,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100760,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Sun'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: true,
              },
              {
                id: 100761,
                timeSlot: 'AM',
                weekNumber: 1,
                startTime: '03:15',
                endTime: '11:45',
                daysOfWeek: ['Sat'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: true,
                sundayFlag: false,
              },
              {
                id: 100762,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100763,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100764,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:35',
                endTime: '16:45',
                daysOfWeek: ['Mon'],
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100765,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:10',
                endTime: '16:45',
                daysOfWeek: ['Tue'],
                mondayFlag: false,
                tuesdayFlag: true,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100766,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:10',
                endTime: '16:45',
                daysOfWeek: ['Sun'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: true,
              },
              {
                id: 100767,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:10',
                endTime: '16:45',
                daysOfWeek: ['Sat'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: true,
                sundayFlag: false,
              },
              {
                id: 100768,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '13:45',
                endTime: '16:45',
                daysOfWeek: ['Thu'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: true,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100769,
                timeSlot: 'ED',
                weekNumber: 1,
                startTime: '17:30',
                endTime: '19:15',
                daysOfWeek: ['Wed'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: true,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100770,
                timeSlot: 'ED',
                weekNumber: 1,
                startTime: '17:35',
                endTime: '19:15',
                daysOfWeek: ['Mon'],
                mondayFlag: true,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 100771,
                timeSlot: 'ED',
                weekNumber: 1,
                startTime: '17:35',
                endTime: '19:15',
                daysOfWeek: ['Sun'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: true,
              },
            ],
            startDate: '2023-10-24',
            endDate: '2026-10-05',
            runsOnBankHoliday: true,
            updatedTime: '2024-10-18T09:18:57',
            updatedBy: 'DHOUSTON_GEN',
            usePrisonRegimeTime: true,
          },
        ],
        pay: [
          {
            id: 6160,
            incentiveNomisCode: 'STD',
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 313,
              displaySequence: 10,
              alias: 'Pay band 10 (Highest)',
              description: 'Pay band 10 (Highest)',
              nomisPayBand: 10,
              prisonCode: 'LHI',
            },
            rate: 55,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 6159,
            incentiveNomisCode: 'ENH',
            incentiveLevel: 'Enhanced',
            prisonPayBand: {
              id: 314,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'HMI',
            },
            rate: 62,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 6162,
            incentiveNomisCode: 'STD',
            incentiveLevel: 'Standard',
            prisonPayBand: {
              id: 314,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'HMI',
            },
            rate: 62,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 6163,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            prisonPayBand: {
              id: 314,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'HMI',
            },
            rate: 100,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
          {
            id: 6161,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            prisonPayBand: {
              id: 319,
              displaySequence: 6,
              alias: 'Pay band 6',
              description: 'Pay band 6',
              nomisPayBand: 6,
              prisonCode: 'HMI',
            },
            rate: 55,
            pieceRate: null,
            pieceRateItems: null,
            startDate: null,
          },
        ],
        startDate: '2023-10-24',
        endDate: '2026-10-05',
        riskLevel: 'medium',
        createdTime: '2023-10-23T09:59:24',
        createdBy: 'MIGRATION',
        updatedTime: '2024-10-18T09:18:57',
        updatedBy: 'DHOUSTON_GEN',
        minimumEducationLevel: [],
        paid: true,
      }
      const customTimesActivity: Activity = {
        id: 872,
        prisonCode: 'RSI',
        attendanceRequired: true,
        inCell: false,
        onWing: false,
        offWing: true,
        pieceWork: false,
        outsideWork: false,
        payPerSession: 'H',
        summary: 'AP test activity 3',
        description: 'AP test activity 3',
        category: {
          id: 5,
          code: 'SAA_INDUCTION',
          name: 'Induction',
          description: 'Such as gym induction, education assessments or health and safety workshops',
        },
        tier: {
          id: 2,
          code: 'TIER_2',
          description: 'Tier 2',
        },
        organiser: {
          id: 3,
          code: 'EXTERNAL_PROVIDER',
          description: 'An external provider',
        },
        eligibilityRules: [],
        schedules: [
          {
            id: 851,
            instances: [
              {
                id: 166629,
                date: '2024-10-10',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1394,
                date: '2024-10-17',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1395,
                date: '2024-10-18',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1396,
                date: '2024-10-24',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1397,
                date: '2024-10-25',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1398,
                date: '2024-10-31',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1399,
                date: '2024-11-01',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1400,
                date: '2024-11-07',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1401,
                date: '2024-11-08',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1402,
                date: '2024-11-14',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1403,
                date: '2024-11-15',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1404,
                date: '2024-11-21',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1405,
                date: '2024-11-22',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1406,
                date: '2024-11-28',
                startTime: '14:00',
                endTime: '15:00',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
              {
                id: 1407,
                date: '2024-11-29',
                startTime: '14:10',
                endTime: '15:10',
                timeSlot: 'PM',
                cancelled: false,
                cancelledTime: null,
                cancelledBy: null,
                attendances: [],
              },
            ],
            allocations: [],
            description: 'AP test activity 3',
            suspensions: [],
            internalLocation: null,
            capacity: 6,
            activity: {
              id: 872,
              prisonCode: 'RSI',
              attendanceRequired: true,
              inCell: false,
              onWing: false,
              offWing: true,
              pieceWork: false,
              outsideWork: false,
              payPerSession: 'H',
              summary: 'AP test activity 3',
              description: 'AP test activity 3',
              category: {
                id: 5,
                code: 'SAA_INDUCTION',
                name: 'Induction',
                description: 'Such as gym induction, education assessments or health and safety workshops',
              },
              riskLevel: 'high',
              minimumEducationLevel: [],
              endDate: null,
              capacity: 6,
              allocated: 0,
              createdTime: '2024-08-22T09:15:54',
              activityState: 'LIVE',
              paid: false,
            },
            scheduleWeeks: 1,
            slots: [
              {
                id: 1617,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '14:00',
                endTime: '15:00',
                daysOfWeek: ['Thu'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: true,
                fridayFlag: false,
                saturdayFlag: false,
                sundayFlag: false,
              },
              {
                id: 1618,
                timeSlot: 'PM',
                weekNumber: 1,
                startTime: '14:10',
                endTime: '15:10',
                daysOfWeek: ['Fri'],
                mondayFlag: false,
                tuesdayFlag: false,
                wednesdayFlag: false,
                thursdayFlag: false,
                fridayFlag: true,
                saturdayFlag: false,
                sundayFlag: false,
              },
            ],
            startDate: '2024-08-23',
            endDate: null,
            runsOnBankHoliday: false,
            updatedTime: '2024-10-16T15:41:38',
            updatedBy: 'DHOUSTON_GEN',
            usePrisonRegimeTime: false,
          },
        ],
        pay: [],
        startDate: '2024-08-23',
        endDate: null,
        riskLevel: 'high',
        createdTime: '2024-08-22T09:15:54',
        createdBy: 'ANGELAPANDEV',
        updatedTime: '2024-10-16T15:41:38',
        updatedBy: 'DHOUSTON_GEN',
        minimumEducationLevel: [],
        paid: false,
      }

      const slots1: Slot[] = [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['TUESDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['TUESDAY'],
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
          weekNumber: 1,
          timeSlot: 'PM',
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
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['THURSDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['THURSDAY'],
        },
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
          timeSlot: 'PM',
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
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['TUESDAY'],
        },
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
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['THURSDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
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
          timeSlot: 'PM',
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
          weekNumber: 1,
          timeSlot: 'PM',
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['TUESDAY'],
        },
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
          timeSlot: 'PM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['THURSDAY'],
        },
      ]
      const slots2: Slot[] = [
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
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['TUESDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: true,
          daysOfWeek: ['SUNDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'AM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: true,
          sunday: false,
          daysOfWeek: ['SATURDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
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
          timeSlot: 'PM',
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
          timeSlot: 'PM',
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['TUESDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: true,
          daysOfWeek: ['SUNDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: true,
          sunday: false,
          daysOfWeek: ['SATURDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: false,
          sunday: false,
          daysOfWeek: ['THURSDAY'],
        },
        {
          weekNumber: 1,
          timeSlot: 'ED',
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
          weekNumber: 1,
          timeSlot: 'ED',
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
          timeSlot: 'ED',
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: true,
          daysOfWeek: ['SUNDAY'],
        },
      ]

      when(activitiesService.getActivities)
        .calledWith(false, res.locals.user)
        .mockResolvedValueOnce([activitySummary1, activitySummary2, activitySummary3, archivedActivitySummary])

      when(activitiesService.getActivity).calledWith(401, res.locals.user).mockResolvedValueOnce(activity1)
      when(activitiesService.getActivity).calledWith(539, res.locals.user).mockResolvedValueOnce(activity2)
      when(activitiesService.getActivity).calledWith(872, res.locals.user).mockResolvedValueOnce(customTimesActivity)

      await handler.POST(req, res)

      expect(activitiesService.getActivity).toBeCalledTimes(3)

      expect(activitiesService.updatePrisonRegime).toHaveBeenCalledWith(
        expectedRegimeTimes,
        prisonCaseload,
        res.locals.user,
      )
      expect(activitiesService.updateActivity).toHaveBeenCalledWith(401, { slots: slots1 }, res.locals.user)
      expect(activitiesService.updateActivity).toHaveBeenCalledWith(539, { slots: slots2 }, res.locals.user)
      expect(activitiesService.updateActivity).toBeCalledTimes(2)
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
        'Start time must be before any later session start times',
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
        'Start time must be before any later session start times',
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
        'Start time must be before any later session start times',
      )
    })
  })
})
