import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import CancellationReasonRoutes, { CancellationReason } from './cancellationReason'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentCancellationReason } from '../../../../@types/appointments'
import { EditAppointmentJourney } from '../editAppointmentJourney'

describe('Route Handlers - Edit Appointment - Cancellation Reasons', () => {
  const handler = new CancellationReasonRoutes()
  let req: Request
  let res: Response
  const appointmentId = 2

  beforeEach(() => {
    req = {
      session: {
        editAppointmentJourney: {
          numberOfAppointments: 4,
          appointments: [
            {
              sequenceNumber: 1,
              startDate: '2023-01-01',
            },
            {
              sequenceNumber: 2,
              startDate: '2023-01-02',
            },
            {
              sequenceNumber: 3,
              startDate: '2023-01-03',
            },
            {
              sequenceNumber: 4,
              startDate: '2023-01-04',
            },
          ],
          sequenceNumber: 2,
        } as EditAppointmentJourney,
      },
      params: {
        appointmentId,
      },
    } as unknown as Request

    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('should render the apply to view with params', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/cancellation-reason', {
        appointmentId,
      })
    })
  })

  describe('POST', () => {
    it('should save apply to in session and redirect to apply to', async () => {
      req.body = {
        reason: AppointmentCancellationReason.CANCELLED,
      }

      await handler.POST(req, res)

      expect(req.session.editAppointmentJourney.cancellationReason).toEqual(AppointmentCancellationReason.CANCELLED)
      expect(res.redirect).toHaveBeenCalledWith('apply-to')
    })

    it('should save apply to in session and redirect to confirm', async () => {
      req.session.editAppointmentJourney.appointments = [
        {
          sequenceNumber: 2,
          startDate: '2023-01-02',
          cancelled: false,
        },
      ]
      req.body = {
        reason: AppointmentCancellationReason.CREATED_IN_ERROR,
      }

      await handler.POST(req, res)

      expect(req.session.editAppointmentJourney.cancellationReason).toEqual(
        AppointmentCancellationReason.CREATED_IN_ERROR,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirm')
    })
  })

  describe('Validation', () => {
    it('validation fails when no cancellation reason value is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(CancellationReason, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select whether to cancel or delete the appointment',
            property: 'reason',
          },
        ]),
      )
    })

    it('validation fails when invalid cancellation reason value is selected', async () => {
      const body = {
        reason: 'NO_REASON',
      }

      const requestObject = plainToInstance(CancellationReason, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select whether to cancel or delete the appointment',
            property: 'reason',
          },
        ]),
      )
    })

    it('passes validation when valid cancellation reason value is selected', async () => {
      const body = {
        reason: AppointmentCancellationReason.CANCELLED,
      }

      const requestObject = plainToInstance(CancellationReason, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
