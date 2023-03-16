import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RepeatPeriodAndCountRoutes, { RepeatPeriodAndCount } from './repeatPeriodAndCount'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentRepeatPeriod } from '../../../../@types/activitiesAPI/types'

describe('Route Handlers - Create Individual Appointment - Repeat Period and Count', () => {
  const handler = new RepeatPeriodAndCountRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createSingleAppointmentJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the repeat period and count view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/repeat-period-and-count')
    })
  })

  describe('POST', () => {
    it('should save repeat = YES, period and count in session and redirect to check answers page', async () => {
      req.body = {
        repeatPeriod: AppointmentRepeatPeriod.WEEKLY,
        repeatCount: 6,
      }

      expect(req.session.createSingleAppointmentJourney.repeat).toBeUndefined()

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.repeat).toEqual(YesNo.YES)
      expect(req.session.createSingleAppointmentJourney.repeatPeriod).toEqual(AppointmentRepeatPeriod.WEEKLY)
      expect(req.session.createSingleAppointmentJourney.repeatCount).toEqual(6)
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('Validation', () => {
    it('validation fails when no repeat period value is selected', async () => {
      const body = {
        repeatCount: 6,
      }

      const requestObject = plainToInstance(RepeatPeriodAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select how often the appointment will repeat', property: 'repeatPeriod' }]),
      )
    })

    it('validation fails when invalid repeat period value is selected', async () => {
      const body = {
        repeatCount: 'TUESDAYS',
      }

      const requestObject = plainToInstance(RepeatPeriodAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select how often the appointment will repeat', property: 'repeatPeriod' }]),
      )
    })

    it('validation fails when repeat count less than 0 is entered', async () => {
      const body = {
        repeatPeriod: AppointmentRepeatPeriod.WEEKDAY,
        repeatCount: 0,
      }

      const requestObject = plainToInstance(RepeatPeriodAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Enter how many times the appointment will repeat up to a maximum of one year',
            property: 'repeatCount',
          },
        ]),
      )
    })

    it.each([
      { repeatPeriod: AppointmentRepeatPeriod.WEEKDAY, repeatCount: 261, max: 260 },
      { repeatPeriod: AppointmentRepeatPeriod.DAILY, repeatCount: 366, max: 365 },
      { repeatPeriod: AppointmentRepeatPeriod.WEEKLY, repeatCount: 53, max: 52 },
      { repeatPeriod: AppointmentRepeatPeriod.FORTNIGHTLY, repeatCount: 27, max: 26 },
      { repeatPeriod: AppointmentRepeatPeriod.MONTHLY, repeatCount: 13, max: 12 },
    ])(
      'validation fails when repeat period is $repeatPeriod and repeat count greater than $max is entered',
      async ({ repeatPeriod, repeatCount, max }) => {
        const body = {
          repeatPeriod,
          repeatCount,
        }

        const requestObject = plainToInstance(RepeatPeriodAndCount, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([
            {
              error: `Number of appointments must be ${max} or fewer`,
              property: 'repeatCount',
            },
          ]),
        )
      },
    )

    it('passes validation when valid repeat period value is selected and repeat count is entered', async () => {
      const body = {
        repeatPeriod: AppointmentRepeatPeriod.FORTNIGHTLY,
        repeatCount: 3,
      }

      const requestObject = plainToInstance(RepeatPeriodAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
