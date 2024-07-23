import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
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
    startDate: '2022-01-01',
    endDate: '2023-12-01',
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

  const tomorrow = addDays(new Date(), 1)
  const tomorrowStr = formatIsoDate(tomorrow)
  const tomorrowDatePicker = isoDateToDatePickerDate(tomorrowStr)
  const tomorrowMessageDate = formatDate(tomorrow)

  const inFiveDays = addDays(new Date(), 5)
  const inFiveDaysStr = formatIsoDate(inFiveDays)
  const inFiveDaysDatePicker = isoDateToDatePickerDate(inFiveDaysStr)
  const inFiveDaysMessageDate = formatDate(inFiveDays)

  const inThreeDays = addDays(new Date(), 3)
  const inThreeDaysStr = formatIsoDate(inThreeDays)

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
      params: { payRateType: 'single', mode: 'edit' },
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
              startDate: inThreeDaysStr,
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
              startDate: undefined,
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
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${tomorrowMessageDate}`,
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
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${inFiveDaysMessageDate}`,
      )
    })

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
        originalBandId: '17',
        originalIncentiveLevel: 'Basic',
        originalPaymentStartDate: 'undefined',
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
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activity)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: High 2. Your change will take effect from ${inFiveDaysMessageDate}`,
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
      }

      when(activitiesService.getActivity).calledWith(atLeast(33, user)).defaultResolvedValue(activityWithAllocation)

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '../check-pay?preserveHistory=true',
        'Activity updated',
        `You've changed Basic incentive level: Pay band 1 (Lowest). There are 2 people assigned to this pay rate. Your change will take effect from ${inFiveDaysMessageDate}`,
      )
    })
  })

  describe('type validation', () => {
    // FIXME ADD DATE FNS TO TESTS
    let createJourney: unknown

    beforeEach(() => {
      createJourney = { pay: [], flat: [] }
    })

    it('validation fails if the start date is more than 30 days in the future', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 72,
        bandId: 17,
        incentiveLevel: 'Basic',
        startDate: '28/07/2025',
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(PayDateOption, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'The date that takes effect must be between tomorrow and Thursday, 22 August 2024',
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
        startDate: '28/07/2023',
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

    it('passes validation by selecting an acceptable date', async () => {
      createJourney = { pay: [], flat: [], minimumPayRate: 70, maximumPayRate: 100 }
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        rate: 0.7,
        bandId: 1,
        incentiveLevel: 'Basic',
        bandAlias: 'Pay Band 1',
        dateOption: DateOption.TOMORROW,
        startDate: '24/07/2024',
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
