import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RepeatPeriodAndCountRoutes, { RepeatPeriodAndCount } from './repeatPeriodAndCount'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentFrequency } from '../../../../@types/appointments'

describe('Route Handlers - Create Appointment - Repeat Period and Count', () => {
  const handler = new RepeatPeriodAndCountRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {
          prisoners: [
            {
              number: 'A1234BC',
              name: 'Test Prisoner',
              cellLocation: '1-1-1',
            },
          ],
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the repeat period and count view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/repeat-period-and-count')
    })
  })

  describe('POST', () => {
    it('should save repeat = YES, period and count in session and redirect to schedule page', async () => {
      req.body = {
        repeatPeriod: AppointmentFrequency.WEEKLY,
        repeatCount: 6,
      }

      expect(req.session.appointmentJourney.repeat).toBeUndefined()

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
      expect(req.session.appointmentJourney.frequency).toEqual(AppointmentFrequency.WEEKLY)
      expect(req.session.appointmentJourney.numberOfAppointments).toEqual(6)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule')
    })

    it('should throw validation error if appointment occurrence allocations exceed 20,000', async () => {
      req.body = {
        repeatPeriod: AppointmentFrequency.DAILY,
        repeatCount: 350,
      }

      req.session.appointmentJourney.prisoners = Array(60).map((_, i) => ({
        number: `A12${i}BC`,
        name: 'Test Prisoner',
        cellLocation: '1-1-1',
      }))

      await handler.POST(req, res)

      expect(res.validationFailed).toBeCalledWith(
        'repeatCount',
        'You cannot schedule more than 333 appointments for this number of attendees.',
      )
      expect(res.redirectOrReturn).toBeCalledTimes(0)
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
        repeatPeriod: AppointmentFrequency.WEEKDAY,
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
      { repeatPeriod: AppointmentFrequency.WEEKDAY, repeatCount: 261, max: 260 },
      { repeatPeriod: AppointmentFrequency.DAILY, repeatCount: 366, max: 365 },
      { repeatPeriod: AppointmentFrequency.WEEKLY, repeatCount: 53, max: 52 },
      { repeatPeriod: AppointmentFrequency.FORTNIGHTLY, repeatCount: 27, max: 26 },
      { repeatPeriod: AppointmentFrequency.MONTHLY, repeatCount: 13, max: 12 },
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
        repeatPeriod: AppointmentFrequency.FORTNIGHTLY,
        repeatCount: 3,
      }

      const requestObject = plainToInstance(RepeatPeriodAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
