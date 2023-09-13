import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import RepeatFrequencyAndCountRoutes, { RepeatFrequencyAndCount } from './repeatFrequencyAndCount'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentFrequency } from '../../../../@types/appointments'

describe('Route Handlers - Create Appointment - Repeat Frequency and Count', () => {
  const handler = new RepeatFrequencyAndCountRoutes()
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
    it('should render the repeat frequency and count view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/repeat-frequency-and-count')
    })
  })

  describe('POST', () => {
    it('should save repeat = YES, frequency and count in session and redirect to schedule page', async () => {
      req.body = {
        frequency: AppointmentFrequency.WEEKLY,
        numberOfAppointments: 6,
      }

      expect(req.session.appointmentJourney.repeat).toBeUndefined()

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.repeat).toEqual(YesNo.YES)
      expect(req.session.appointmentJourney.frequency).toEqual(AppointmentFrequency.WEEKLY)
      expect(req.session.appointmentJourney.numberOfAppointments).toEqual(6)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('schedule')
    })

    it('should throw validation error if appointment instances exceed 20,000', async () => {
      req.body = {
        frequency: AppointmentFrequency.DAILY,
        numberOfAppointments: 350,
      }

      req.session.appointmentJourney.prisoners = Array(60).map((_, i) => ({
        number: `A12${i}BC`,
        name: 'Test Prisoner',
        cellLocation: '1-1-1',
      }))

      await handler.POST(req, res)

      expect(res.validationFailed).toBeCalledWith(
        'numberOfAppointments',
        'You cannot schedule more than 333 appointments for this number of attendees.',
      )
      expect(res.redirectOrReturn).toBeCalledTimes(0)
    })
  })

  describe('Validation', () => {
    it('validation fails when no repeat frequency value is selected', async () => {
      const body = {
        numberOfAppointments: 6,
      }

      const requestObject = plainToInstance(RepeatFrequencyAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select how often the appointment will repeat', property: 'frequency' }]),
      )
    })

    it('validation fails when invalid repeat frequency value is selected', async () => {
      const body = {
        numberOfAppointments: 'TUESDAYS',
      }

      const requestObject = plainToInstance(RepeatFrequencyAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ error: 'Select how often the appointment will repeat', property: 'frequency' }]),
      )
    })

    it('validation fails when number of appointments less than 0 is entered', async () => {
      const body = {
        frequency: AppointmentFrequency.WEEKDAY,
        numberOfAppointments: 0,
      }

      const requestObject = plainToInstance(RepeatFrequencyAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Enter how many times the appointment will repeat up to a maximum of one year',
            property: 'numberOfAppointments',
          },
        ]),
      )
    })

    it.each([
      { frequency: AppointmentFrequency.WEEKDAY, numberOfAppointments: 261, max: 260 },
      { frequency: AppointmentFrequency.DAILY, numberOfAppointments: 366, max: 365 },
      { frequency: AppointmentFrequency.WEEKLY, numberOfAppointments: 53, max: 52 },
      { frequency: AppointmentFrequency.FORTNIGHTLY, numberOfAppointments: 27, max: 26 },
      { frequency: AppointmentFrequency.MONTHLY, numberOfAppointments: 13, max: 12 },
    ])(
      'validation fails when repeat frequency is $frequency and number of appointments greater than $max is entered',
      async ({ frequency, numberOfAppointments, max }) => {
        const body = {
          frequency,
          numberOfAppointments,
        }

        const requestObject = plainToInstance(RepeatFrequencyAndCount, body)
        const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

        expect(errors).toEqual(
          expect.arrayContaining([
            {
              error: `Number of appointments must be ${max} or fewer`,
              property: 'numberOfAppointments',
            },
          ]),
        )
      },
    )

    it('passes validation when valid repeat frequency value is selected and number of appointments is entered', async () => {
      const body = {
        frequency: AppointmentFrequency.FORTNIGHTLY,
        numberOfAppointments: 3,
      }

      const requestObject = plainToInstance(RepeatFrequencyAndCount, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
