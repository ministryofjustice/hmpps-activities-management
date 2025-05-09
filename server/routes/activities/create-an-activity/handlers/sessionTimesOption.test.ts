import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import SessionTimesOptionRoutes, { SessionTimesOption } from './sessionTimesOption'
import ActivitiesService from '../../../../services/activitiesService'
import BankHolidayService from '../../../../services/bankHolidayService'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { PrisonRegime } from '../../../../@types/activitiesAPI/types'

import atLeast from '../../../../../jest.setup'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/bankHolidayService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const bankHolidayService = new BankHolidayService(null) as jest.Mocked<BankHolidayService>

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

describe('Route Handlers - Create an activity schedule - activity times option', () => {
  const handler = new SessionTimesOptionRoutes(activitiesService, bankHolidayService)
  const mockBankHolidaysList = [
    new Date('2025-01-01'),
    new Date('2025-04-18'),
    new Date('2025-04-21'),
    new Date('2025-05-05'),
    new Date('2025-05-26'),
  ]

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
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          endDateOption: 'yes',
          slots: {
            '1': {
              days: ['tuesday', 'friday'],
              timeSlotsTuesday: ['AM'],
              timeSlotsFriday: ['PM', 'ED'],
            },
          },
        },
      },
      customSlots: [
        {
          id: 1,
          timeSlot: 'AM',
          weekNumber: 1,
          startTIme: '10:00',
          endTime: '11:00',
          daysOfWeek: ['MONDAY', 'TUESDAY'],
          mondayFlag: true,
          tuesdayFlag: true,
          wednesdayFlag: false,
          thursdayFlag: false,
          fridayFlag: false,
          saturdayFlag: false,
          sundayFlag: false,
        },
      ],
      params: {},
    } as unknown as Request

    activitiesService.getPrisonRegime.mockReturnValue(Promise.resolve(prisonRegime))
    when(bankHolidayService.getUkBankHolidays)
      .calledWith(atLeast(res.locals.user))
      .mockResolvedValueOnce(mockBankHolidaysList)
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      req.params = {
        weekNumber: '1',
      }
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/session-times-option', {
        regimeTimes: [
          { amFinish: '11:45', amStart: '08:30', dayOfWeek: 'TUESDAY' },
          { dayOfWeek: 'FRIDAY', edFinish: '19:15', edStart: '17:30', pmFinish: '16:45', pmStart: '13:45' },
        ],
      })
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      req.query = {}
    })

    describe('Create Journey', () => {
      it('when using prison regime times redirect to the bank holiday page', async () => {
        req.body = {
          usePrisonRegimeTime: 'true',
        }
        req.session.createJourney.startDate = '2025-05-08'
        req.session.createJourney.endDate = '2025-06-08'
        req.session.createJourney.scheduleWeeks = 1
        await handler.POST(req, res)

        expect(req.session.createJourney.customSlots).toEqual(undefined)
        expect(res.redirectOrReturn).toHaveBeenCalledWith('../bank-holiday-option')
      })

      it('when using prison custom times redirect to the activity session times page', async () => {
        req.body = {
          usePrisonRegimeTime: 'false',
        }

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('../session-times')
      })
    })

    describe('Change data from check answers page', () => {
      beforeEach(() => {
        req.query.preserverHistory = 'true'
      })

      it('when using prison regime times with valid days redirect to the bank holiday page', async () => {
        req.body = {
          usePrisonRegimeTime: 'true',
        }
        req.session.createJourney.startDate = '2025-05-08'
        req.session.createJourney.endDate = '2025-06-08'
        req.session.createJourney.scheduleWeeks = 1
        await handler.POST(req, res)

        expect(req.session.createJourney.customSlots).toEqual(undefined)
        expect(res.redirectOrReturn).toHaveBeenCalledWith('../bank-holiday-option')
      })

      it('when using prison regime times with no valid days redirect to the capacity page for inCell location', async () => {
        req.body = {
          usePrisonRegimeTime: 'true',
        }
        req.session.createJourney.endDateOption = 'no'
        req.session.createJourney.inCell = true
        await handler.POST(req, res)

        expect(req.session.createJourney.customSlots).toEqual(undefined)
        expect(res.redirectOrReturn).toHaveBeenCalledWith('../capacity')
      })

      it('when using prison regime times with no valid days redirect to the location page for not inCell location', async () => {
        req.body = {
          usePrisonRegimeTime: 'true',
        }
        req.session.createJourney.endDateOption = 'no'
        req.session.createJourney.inCell = false
        await handler.POST(req, res)

        expect(req.session.createJourney.customSlots).toEqual(undefined)
        expect(res.redirectOrReturn).toHaveBeenCalledWith('../location')
      })

      it('when using prison custom times redirect to the activity session times page', async () => {
        req.body = {
          usePrisonRegimeTime: 'false',
        }
        req.query.preserveHistory = 'true'

        await handler.POST(req, res)

        expect(res.redirect).toHaveBeenCalledWith('../session-times?preserveHistory=true')
      })
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        usePrisonRegimeTime: '',
      }

      const requestObject = plainToInstance(SessionTimesOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'usePrisonRegimeTime', error: 'Select how to set the activity start and end times' },
      ])
    })
  })
})
