import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, subDays } from 'date-fns'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { IncentiveLevel } from '../../../../@types/incentivesApi/types'
import {
  Activity,
  ActivitySchedule,
  ActivityScheduleSlot,
  Allocation,
  PrisonPayBand,
} from '../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty, formatDate } from '../../../../utils/utils'
import PayDateOptionRoutes, { PayDateOption } from './pay-date-option'
import DateOption from '../../../../enum/dateOption'
import { ServiceUser } from '../../../../@types/express'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { formatIsoDate, isoDateToDatePickerDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Pay date option', () => {
  const handler = new PayDateOptionRoutes(prisonService, activitiesService)

  const user = {
    username: 'joebloggs',
  } as ServiceUser

  const slot: ActivityScheduleSlot = {
    id: 1,
    timeSlot: 'AM',
    weekNumber: 1,
    startTime: '9:00',
    endTime: '11:30',
    daysOfWeek: ['Mon', 'Tue'],
    mondayFlag: true,
    tuesdayFlag: true,
    wednesdayFlag: false,
    thursdayFlag: false,
    fridayFlag: false,
    saturdayFlag: false,
    sundayFlag: false,
  }

  const schedule: ActivitySchedule = {
    id: 1,
    scheduleWeeks: 1,
    slots: [slot],
    runsOnBankHoliday: false,
    capacity: 10,
    internalLocation: {
      id: 14438,
      code: 'AWING',
      description: 'A-Wing',
    },
    allocations: [],
  } as ActivitySchedule

  const yesterday = subDays(new Date(), 1)
  const yesterdayStr = formatIsoDate(yesterday)
  const yesterdayDatePicker = isoDateToDatePickerDate(yesterdayStr)

  const today = new Date()
  const todayStr = formatIsoDate(today)
  const todayDatePicker = isoDateToDatePickerDate(todayStr)

  const tomorrow = addDays(new Date(), 1)
  const tomorrowStr = formatIsoDate(tomorrow)
  const tomorrowDatePicker = isoDateToDatePickerDate(tomorrowStr)
  const tomorrowMessageDate = formatDate(tomorrow)

  const inThreeDays = addDays(new Date(), 3)
  const inThreeDaysStr = formatIsoDate(inThreeDays)

  const inFiveDays = addDays(new Date(), 5)
  const inFiveDaysStr = formatIsoDate(inFiveDays)
  const inFiveDaysDatePicker = isoDateToDatePickerDate(inFiveDaysStr)
  const inFiveDaysMessageDate = formatDate(inFiveDays)

  const inTwentyNineDays = addDays(new Date(), 29)
  const inTwentyNineDaysStr = formatIsoDate(inTwentyNineDays)
  const inTwentyNineDaysDatePicker = isoDateToDatePickerDate(inTwentyNineDaysStr)

  const inThirtyDays = addDays(new Date(), 30)
  const inThirtyDaysStr = formatIsoDate(inThirtyDays)
  const inThirtyDaysDatePicker = isoDateToDatePickerDate(inThirtyDaysStr)
  const inThirtyDaysMessageDate = formatDate(inThirtyDays)

  const activity = {
    id: 33,
    category: {
      id: 1,
      code: 'LEISURE_SOCIAL',
    },
    tier: {
      id: 1,
    },
    organiser: {
      id: 1,
    },
    inCell: false,
    onWing: false,
    offWing: false,
    riskLevel: 'high',
    summary: 'activity summary',
    startDate: yesterdayStr,
    endDate: undefined,
    pay: [
      {
        id: 17,
        incentiveNomisCode: 'BAS',
        incentiveLevel: 'Basic',
        rate: 150,
      },
    ],
    attendanceRequired: false,
    minimumEducationLevel: [
      {
        id: 123456,
        educationLevelCode: 'Basic',
        studyAreaCode: 'ENGLA',
      },
    ],
    schedules: [schedule],
  } as unknown as Activity

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
    } as unknown as Response

    req = {
      routeContext: { mode: 'edit' },
      params: { payRateType: 'single' },
      session: {
        createJourney: {
          activityId: 33,
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          paid: true,
          pay: [
            {
              id: 349,
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              prisonPayBand: {
                id: 17,
                displaySequence: 1,
                alias: 'Pay band 1 (Lowest)',
                description: 'Pay band 1 (Lowest)',
                nomisPayBand: 1,
                prisonCode: 'RSI',
              },
              rate: 50,
              pieceRate: null,
              pieceRateItems: null,
            },
            {
              id: 353,
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              prisonPayBand: {
                id: 18,
                displaySequence: 2,
                alias: 'Pay band 2',
                description: 'Pay band 2',
                nomisPayBand: 2,
                prisonCode: 'RSI',
              },
              rate: 65,
              pieceRate: null,
              pieceRateItems: null,
            },
            {
              id: 354,
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              prisonPayBand: {
                id: 3,
                displaySequence: 3,
                alias: 'High 2',
                description: 'High 2',
                nomisPayBand: 3,
                prisonCode: 'RSI',
              },
              rate: 65,
              pieceRate: null,
              pieceRateItems: null,
            },
          ],
          flat: [],
          allocations: [],
          minimumPayRate: 50,
          maximumPayRate: 250,
        },
      },
    } as unknown as Request

    const prisoners = [
      {
        prisonerNumber: 'ABC123',
        firstName: 'Joe',
        lastName: 'Bloggs',
        cellLocation: 'MDI-1-001',
        alerts: [],
        category: 'A',
        currentIncentive: {
          level: {
            description: 'Basic',
          },
        },
      },
      {
        prisonerNumber: 'ABC321',
        firstName: 'Alan',
        lastName: 'Key',
        cellLocation: 'MDI-1-002',
        alerts: [],
        category: 'A',
        currentIncentive: {
          level: {
            description: 'Basic',
          },
        },
      },
      {
        prisonerNumber: 'ZXY123',
        firstName: 'Mr',
        lastName: 'Blobby',
        cellLocation: 'MDI-1-003',
        alerts: [],
        category: 'A',
        currentIncentive: {
          level: {
            description: 'Baxic',
          },
        },
      },
    ] as Prisoner[]

    when(activitiesService.getPayBandsForPrison).mockResolvedValue([
      { id: 17, alias: 'Low', displaySequence: 1 },
      { id: 18, alias: 'High', displaySequence: 2 },
      { id: 3, alias: 'High 2', displaySequence: 3 },
    ] as PrisonPayBand[])

    when(prisonService.getIncentiveLevels)
      .calledWith(atLeast('MDI'))
      .mockResolvedValue([
        { levelCode: 'BAS', levelName: 'Basic' },
        { levelCode: 'STD', levelName: 'Standard' },
        { levelCode: 'ENH', levelName: 'Enhanced' },
      ] as IncentiveLevel[])

    when(prisonService.searchInmatesByPrisonerNumbers).calledWith(atLeast(res.locals.user)).mockResolvedValue(prisoners)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page correctly with a payment start date', async () => {
      req.query = { iep: 'Basic', bandId: '17', paymentStartDate: '2024-07-26', rate: '50' }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([{ levelName: 'Standard' }] as IncentiveLevel[])

      when(prisonService.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue({
        agencyId: 'MDI',
        startDate: '2015-06-26',
        autoPayFlag: true,
        minHalfDayRate: 0.1,
        maxHalfDayRate: 3,
      })

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-date-option', {
        rate: '50',
        iep: 'Basic',
        paymentStartDate: '2024-07-26',
        band: { id: 17, alias: 'Low', displaySequence: 1 },
        payRateType: 'single',
      })
    })

    it('should render page correctly with no payment start date', async () => {
      req.query = { iep: 'Basic', bandId: '18', paymentStartDate: 'undefined', rate: '45' }

      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValueOnce([{ levelName: 'Standard' }] as IncentiveLevel[])

      when(prisonService.getPayProfile).calledWith(atLeast('MDI')).mockResolvedValue({
        agencyId: 'MDI',
        startDate: '2015-06-26',
        autoPayFlag: true,
        minHalfDayRate: 0.1,
        maxHalfDayRate: 3,
      })

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/pay-date-option', {
        rate: '45',
        iep: 'Basic',
        paymentStartDate: 'undefined',
        band: { id: 18, alias: 'High', displaySequence: 2 },
        payRateType: 'single',
      })
    })
  })

  describe('POST', () => {
    it('should save a payment change for tomorrow where there is no existing future payment change', async () => {
      req.body = {
        rate: 72,
        bandId: 3,
        incentiveLevel: 'Basic',
        startDate: tomorrowDatePicker,
        dateOption: DateOption.TOMORROW,
      }
      req.query = {
        preserveHistory: 'true',
        originalBandId: '3',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: 'undefined',
        bandId: '3',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${tomorrowMessageDate}`,
      )
    })

    it('should save a future payment change where there is no existing future payment change', async () => {
      req.body = {
        rate: 72,
        bandId: 3,
        incentiveLevel: 'Basic',
        startDate: inFiveDaysDatePicker,
        dateOption: DateOption.OTHER,
      }
      req.query = {
        preserveHistory: 'true',
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: 'undefined',
        bandId: '3',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${inFiveDaysMessageDate}`,
      )

      expect(activitiesService.updateActivity).toHaveBeenLastCalledWith(
        33,
        {
          paid: true,
          attendanceRequired: true,
          pay: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 50,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 18,
              rate: 65,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 65,
              startDate: undefined,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 72,
              startDate: inFiveDaysStr,
            },
          ],
          payChange: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 72,
              startDate: inFiveDaysStr,
              changedDetails: `Amount increased to £0.72, from ${formatDate(inFiveDaysStr, 'd MMM yyyy')}`,
              changedBy: 'joebloggs',
            },
          ],
        },
        {
          activeCaseLoadId: 'MDI',
          username: 'joebloggs',
        },
      )
    })

    it('should save a payment change for tomorrow where there is an existing future payment change', async () => {
      req.body = {
        rate: 72,
        bandId: 3,
        incentiveLevel: 'Basic',
        startDate: tomorrowStr,
        dateOption: DateOption.TOMORROW,
      }
      req.query = {
        preserveHistory: 'true',
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: inThreeDaysStr,
        bandId: '3',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${tomorrowMessageDate}`,
      )

      expect(activitiesService.updateActivity).toHaveBeenLastCalledWith(
        33,
        {
          paid: true,
          attendanceRequired: true,
          pay: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 50,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 18,
              rate: 65,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 65,
              startDate: undefined,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 72,
              startDate: tomorrowStr,
            },
          ],
          payChange: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 72,
              startDate: tomorrowStr,
              changedDetails: `Amount increased to £0.72, from ${formatDate(tomorrowStr, 'd MMM yyyy')}`,
              changedBy: 'joebloggs',
            },
          ],
        },
        {
          activeCaseLoadId: 'MDI',
          username: 'joebloggs',
        },
      )
    })

    it('should save a future payment change where there is an existing future payment change', async () => {
      req.body = {
        rate: 72,
        bandId: 3,
        incentiveLevel: 'Basic',
        startDate: inFiveDaysDatePicker,
        dateOption: DateOption.OTHER,
      }
      req.query = {
        preserveHistory: 'true',
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: inThreeDaysStr,
        bandId: '3',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${inFiveDaysMessageDate}`,
      )

      expect(activitiesService.updateActivity).toHaveBeenLastCalledWith(
        33,
        {
          paid: true,
          attendanceRequired: true,
          pay: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 50,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 18,
              rate: 65,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 65,
              startDate: undefined,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 72,
              startDate: inFiveDaysStr,
            },
          ],
          payChange: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 72,
              startDate: inFiveDaysStr,
              changedDetails: `Amount increased to £0.72, from ${formatDate(inFiveDaysStr, 'd MMM yyyy')}`,
              changedBy: 'joebloggs',
            },
          ],
        },
        {
          activeCaseLoadId: 'MDI',
          username: 'joebloggs',
        },
      )
    })

    it('should update existing pay rate where there is no existing future payment change and the activity is due to start tomorrow', async () => {
      const req2 = {
        params: { payRateType: 'single' },
        routeContext: { mode: 'edit' },
        session: {
          createJourney: {
            activityId: 44,
            name: 'Maths level 1',
            category: {
              id: 1,
            },
            paid: true,
            pay: [
              {
                id: 349,
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                prisonPayBand: {
                  id: 17,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'RSI',
                },
                rate: 150,
                pieceRate: null,
                pieceRateItems: null,
              },
              {
                id: 353,
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                prisonPayBand: {
                  id: 18,
                  displaySequence: 2,
                  alias: 'Pay band 2',
                  description: 'Pay band 2',
                  nomisPayBand: 2,
                  prisonCode: 'RSI',
                },
                rate: 65,
                pieceRate: null,
                pieceRateItems: null,
              },
              {
                id: 354,
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                prisonPayBand: {
                  id: 3,
                  displaySequence: 3,
                  alias: 'High 2',
                  description: 'High 2',
                  nomisPayBand: 3,
                  prisonCode: 'RSI',
                },
                rate: 65,
                pieceRate: null,
                pieceRateItems: null,
              },
            ],
            flat: [],
            allocations: [],
            minimumPayRate: 50,
            maximumPayRate: 250,
          },
        },
      } as unknown as Request

      const activity2 = {
        id: 44,
        category: {
          id: 1,
          code: 'LEISURE_SOCIAL',
        },
        tier: {
          id: 1,
        },
        organiser: {
          id: 1,
        },
        inCell: false,
        onWing: false,
        offWing: false,
        riskLevel: 'high',
        summary: 'activity summary',
        startDate: tomorrowStr,
        endDate: undefined,
        pay: [
          {
            id: 17,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            rate: 150,
          },
        ],
        attendanceRequired: false,
        minimumEducationLevel: [
          {
            id: 123456,
            educationLevelCode: 'Basic',
            studyAreaCode: 'ENGLA',
          },
        ],
        schedules: [schedule],
      } as unknown as Activity

      req2.body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: tomorrowDatePicker,
        dateOption: DateOption.TOMORROW,
      }
      req2.query = {
        preserveHistory: 'true',
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: 'undefined',
        bandId: '17',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(44, user)).defaultResolvedValue(activity2)

      await handler.POST(req2, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: Pay band 1 (Lowest). Your change will take effect from ${tomorrowMessageDate}`,
      )

      expect(activitiesService.updateActivity).toHaveBeenLastCalledWith(
        44,
        {
          paid: true,
          attendanceRequired: true,
          pay: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 72,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 18,
              rate: 65,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 65,
            },
          ],
          payChange: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 72,
              startDate: tomorrowStr,
              changedDetails: `Amount reduced to £0.72, from ${formatDate(tomorrowStr, 'd MMM yyyy')}`,
              changedBy: 'joebloggs',
            },
          ],
        },
        {
          activeCaseLoadId: 'MDI',
          username: 'joebloggs',
        },
      )
    })

    it('should update existing pay rate where there is no existing future payment change and the activity is due to start after tomorrow', async () => {
      const req2 = {
        routeContext: { mode: 'edit' },
        params: { payRateType: 'single' },
        session: {
          createJourney: {
            activityId: 44,
            name: 'Maths level 1',
            category: {
              id: 1,
            },
            paid: true,
            pay: [
              {
                id: 349,
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                prisonPayBand: {
                  id: 17,
                  displaySequence: 1,
                  alias: 'Pay band 1 (Lowest)',
                  description: 'Pay band 1 (Lowest)',
                  nomisPayBand: 1,
                  prisonCode: 'RSI',
                },
                rate: 50,
                pieceRate: null,
                pieceRateItems: null,
              },
              {
                id: 353,
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                prisonPayBand: {
                  id: 18,
                  displaySequence: 2,
                  alias: 'Pay band 2',
                  description: 'Pay band 2',
                  nomisPayBand: 2,
                  prisonCode: 'RSI',
                },
                rate: 65,
                pieceRate: null,
                pieceRateItems: null,
              },
              {
                id: 354,
                incentiveNomisCode: 'BAS',
                incentiveLevel: 'Basic',
                prisonPayBand: {
                  id: 3,
                  displaySequence: 3,
                  alias: 'High 2',
                  description: 'High 2',
                  nomisPayBand: 3,
                  prisonCode: 'RSI',
                },
                rate: 65,
                pieceRate: null,
                pieceRateItems: null,
              },
            ],
            flat: [],
            allocations: [],
            minimumPayRate: 50,
            maximumPayRate: 250,
          },
        },
      } as unknown as Request

      const activity2 = {
        id: 44,
        category: {
          id: 1,
          code: 'LEISURE_SOCIAL',
        },
        tier: {
          id: 1,
        },
        organiser: {
          id: 1,
        },
        inCell: false,
        onWing: false,
        offWing: false,
        riskLevel: 'high',
        summary: 'activity summary',
        startDate: inFiveDaysStr,
        endDate: undefined,
        pay: [
          {
            id: 17,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            rate: 150,
          },
        ],
        attendanceRequired: false,
        minimumEducationLevel: [
          {
            id: 123456,
            educationLevelCode: 'Basic',
            studyAreaCode: 'ENGLA',
          },
        ],
        schedules: [schedule],
      } as unknown as Activity

      req2.body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: tomorrowDatePicker,
        dateOption: DateOption.TOMORROW,
      }
      req2.query = {
        preserveHistory: 'true',
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: 'undefined',
        bandId: '17',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(44, user)).defaultResolvedValue(activity2)

      await handler.POST(req2, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: Pay band 1 (Lowest). Your change will take effect from ${tomorrowMessageDate}`,
      )

      expect(activitiesService.updateActivity).toHaveBeenLastCalledWith(
        44,
        {
          paid: true,
          attendanceRequired: true,
          pay: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 72,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 18,
              rate: 65,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 65,
            },
          ],
          payChange: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 72,
              startDate: tomorrowStr,
              changedDetails: `Amount increased to £0.72, from ${formatDate(tomorrowStr, 'd MMM yyyy')}`,
              changedBy: 'joebloggs',
            },
          ],
        },
        {
          activeCaseLoadId: 'MDI',
          username: 'joebloggs',
        },
      )
    })

    it('should save a future payment change with an allocation', async () => {
      const allocation1: Allocation = {
        id: 1,
        startDate: '2022-02-01',
        prisonPayBand: { id: 17 },
        prisonerNumber: 'ABC123',
      } as Allocation

      const allocation2 = {
        id: 2,
        startDate: '2022-02-02',
        prisonPayBand: { id: 17 },
        prisonerNumber: 'ABC321',
      } as Allocation

      const slot2: ActivityScheduleSlot = {
        id: 1,
        timeSlot: 'AM',
        weekNumber: 1,
        startTime: '9:00',
        endTime: '11:30',
        daysOfWeek: ['Mon', 'Tue'],
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      }

      const schedule2: ActivitySchedule = {
        id: 1,
        scheduleWeeks: 1,
        slots: [slot2],
        runsOnBankHoliday: false,
        capacity: 10,
        internalLocation: {
          id: 14438,
          code: 'AWING',
          description: 'A-Wing',
        },
        allocations: [allocation1, allocation2],
      } as ActivitySchedule

      const activityWithAllocation = {
        id: 33,
        category: {
          id: 1,
          code: 'LEISURE_SOCIAL',
        },
        tier: {
          id: 1,
        },
        organiser: {
          id: 1,
        },
        inCell: false,
        onWing: false,
        offWing: false,
        riskLevel: 'high',
        summary: 'activity summary',
        startDate: '2022-01-01',
        endDate: '2023-12-01',
        pay: [
          {
            id: 123456,
            incentiveNomisCode: 'BAS',
            incentiveLevel: 'Basic',
            rate: 150,
          },
        ],
        attendanceRequired: false,
        minimumEducationLevel: [
          {
            id: 123456,
            educationLevelCode: 'Basic',
            studyAreaCode: 'ENGLA',
          },
        ],
        schedules: [schedule2],
      } as unknown as Activity

      req.body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: inFiveDaysDatePicker,
        dateOption: DateOption.OTHER,
      }
      req.query = {
        preserveHistory: 'true',
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: 'undefined',
        bandId: '17',
        iep: 'Basic',
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activityWithAllocation)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: Pay band 1 (Lowest). There are 2 people assigned to this pay rate. Your change will take effect from ${inFiveDaysMessageDate}`,
      )

      expect(activitiesService.updateActivity).toHaveBeenLastCalledWith(
        33,
        {
          paid: true,
          attendanceRequired: true,
          pay: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 50,
              startDate: undefined,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 18,
              rate: 65,
              startDate: undefined,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 3,
              rate: 65,
              startDate: undefined,
            },
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 72,
              startDate: inFiveDaysStr,
            },
          ],
          payChange: [
            {
              incentiveNomisCode: 'BAS',
              incentiveLevel: 'Basic',
              payBandId: 17,
              rate: 72,
              startDate: inFiveDaysStr,
              changedDetails: `Amount increased to £0.72, from ${formatDate(inFiveDaysStr, 'd MMM yyyy')}`,
              changedBy: 'joebloggs',
            },
          ],
        },
        {
          activeCaseLoadId: 'MDI',
          username: 'joebloggs',
        },
      )
    })
  })

  describe('type validation', () => {
    let createJourney: unknown

    beforeEach(() => {
      createJourney = { pay: [], flat: [] }
    })

    it('validation fails if the start date is today', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: todayDatePicker,
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(PayDateOption, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: `The change the date takes effect must be in the future`,
            property: 'startDate',
          },
        ]),
      )
    })

    it('validation fails if the start date is 30 days in the future', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: inThirtyDaysDatePicker,
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(PayDateOption, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: `The date that takes effect must be between tomorrow and ${inThirtyDaysMessageDate}`,
            property: 'startDate',
          },
        ]),
      )
    })

    it('validation fails if the start date is in the past', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: yesterdayDatePicker,
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(PayDateOption, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'The change the date takes effect must be in the future',
            property: 'startDate',
          },
        ]),
      )
    })

    it('validation fails if the start date is not selected', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(PayDateOption, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Enter a valid date',
            property: 'startDate',
          },
        ]),
      )
    })

    it('passes validation by selecting 29 days in the future date', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.7,
        bandId: 1,
        incentiveLevel: 'Basic',
        bandAlias: 'Pay Band 1',
        dateOption: DateOption.OTHER,
        startDate: inTwentyNineDaysDatePicker,
      }

      const requestObject = plainToInstance(PayDateOption, {
        createJourney,
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation by selecting tomorrow in the future date', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.7,
        bandId: 1,
        incentiveLevel: 'Basic',
        bandAlias: 'Pay Band 1',
        dateOption: DateOption.TOMORROW,
        startDate: tomorrow,
      }

      const requestObject = plainToInstance(PayDateOption, {
        createJourney,
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
