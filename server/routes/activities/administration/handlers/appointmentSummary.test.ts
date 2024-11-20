import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, subDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import AppointmentSummaryRoutes, { AppointmentSummary } from './appointmentSummary'
import DateOption from '../../../../enum/dateOption'
import { formatDatePickerDate, formatIsoDate, isoDateToDatePickerDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Change Regime times', () => {
  const handler = new AppointmentSummaryRoutes(activitiesService)
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

    activitiesService.getAppointmentCategories.mockReturnValue(
      Promise.resolve([
        {
          code: 'ACTI',
          description: 'Activities',
        },
        {
          code: 'OIC',
          description: 'Adjudication Review',
        },
        {
          code: 'CANT',
          description: 'Canteen',
        },
      ]),
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render appointment summary page', async () => {
      await handler.GET(req, res)

      const appointmentCategorySummaries = [
        {
          code: 'ACTI',
          description: 'Activities',
        },
        {
          code: 'OIC',
          description: 'Adjudication Review',
        },
        {
          code: 'CANT',
          description: 'Canteen',
        },
      ]

      expect(res.render).toHaveBeenCalledWith('pages/activities/administration/appointment-summary', {
        appointmentCategorySummaries,
      })
    })
  })

  describe('POST', () => {
    it('should select categories and a start date tomorrow will request the appointment preview successfully', async () => {
      req.body = {
        dateOption: DateOption.TOMORROW,
        appointmentCategorySummaries: 'ACTI,OIC',
      }

      const tomorrow = formatIsoDate(addDays(new Date(), 1))

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`appointment-preview?fromDate=${tomorrow}&categories=ACTI,OIC`)
    })

    it('should select categories and a future date tomorrow will request the appointment preview successfully', async () => {
      req.body = {
        startDate: formatDatePickerDate(addDays(new Date(), 3)),
        dateOption: DateOption.OTHER,
        appointmentCategorySummaries: 'ACTI,OIC',
      }

      const threeDays = formatIsoDate(addDays(new Date(), 3))

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`appointment-preview?fromDate=${threeDays}&categories=ACTI,OIC`)
    })
  })

  describe('Validation', () => {
    const yesterday = subDays(new Date(), 1)
    const yesterdayStr = formatIsoDate(yesterday)
    const yesterdayDatePicker = isoDateToDatePickerDate(yesterdayStr)

    const today = new Date()
    const todayStr = formatIsoDate(today)
    const todayDatePicker = isoDateToDatePickerDate(todayStr)

    const tomorrow = addDays(new Date(), 1)

    it('validation fails if the start date is today', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        startDate: todayDatePicker,
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(AppointmentSummary, { pathParams, queryParams, ...body })
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

    it('validation fails if the start date is in the past', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        startDate: yesterdayDatePicker,
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(AppointmentSummary, { pathParams, queryParams, ...body })
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
        dateOption: DateOption.OTHER,
      }

      const requestObject = plainToInstance(AppointmentSummary, { pathParams, queryParams, ...body })
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

    it('validation fails if a category is not selected', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        dateOption: DateOption.TOMORROW,
        startDate: tomorrow,
      }

      const requestObject = plainToInstance(AppointmentSummary, { pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select at least one category',
            property: 'appointmentCategorySummaries',
          },
        ]),
      )
    })

    it('passes validation by selecting tomorrow in the future date and a category is selected', async () => {
      const pathParams = { payRateType: 'single' }
      const queryParams = {}
      const body = {
        dateOption: DateOption.TOMORROW,
        startDate: tomorrow,
        appointmentCategorySummaries: 'TEST',
      }

      const requestObject = plainToInstance(AppointmentSummary, {
        pathParams,
        queryParams,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
