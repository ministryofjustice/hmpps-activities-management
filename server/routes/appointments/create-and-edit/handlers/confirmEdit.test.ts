import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import ConfirmEditRoutes, { ConfirmEdit } from './confirmEdit'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentApplyTo } from '../../../../@types/appointments'
import { formatIsoDate, parseIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/editAppointmentService')

const editAppointmentService = new EditAppointmentService(null, null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Edit Appointment - Confirm', () => {
  const handler = new ConfirmEditRoutes(editAppointmentService)
  const weekTomorrow = addDays(new Date(), 8)
  let req: Request
  let res: Response
  const appointmentId = 2

  beforeEach(() => {
    req = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          startDate: formatIsoDate(weekTomorrow),
        },
        editAppointmentJourney: {
          numberOfAppointments: 4,
          appointments: [
            {
              sequenceNumber: 1,
              startDate: format(weekTomorrow, 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 2,
              startDate: format(addDays(weekTomorrow, 1), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 3,
              startDate: format(addDays(weekTomorrow, 2), 'yyyy-MM-dd'),
            },
            {
              sequenceNumber: 4,
              startDate: format(addDays(weekTomorrow, 3), 'yyyy-MM-dd'),
            },
          ],
          sequenceNumber: 2,
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
        } as EditAppointmentJourney,
      },
      params: {
        appointmentId,
      },
    } as unknown as Request

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('should render the confirm edit view with params and session data', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirm-edit', {
        appointmentId,
        startDate: parseIsoDate(req.session.appointmentJourney.startDate),
      })
    })
  })

  describe('POST', () => {
    it('should redirect to appointment details page', async () => {
      req.body = {
        confirm: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
    })

    it('should edit', async () => {
      req.body = {
        confirm: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    })
  })

  describe('Validation', () => {
    it('validation fails when no confirm value is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(ConfirmEdit, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select yes to confirm', property: 'confirm' }]))
    })

    it('validation fails when invalid confirm value is selected', async () => {
      const body = {
        confirm: 'MAYBE',
      }

      const requestObject = plainToInstance(ConfirmEdit, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select yes to confirm', property: 'confirm' }]))
    })

    it('passes validation when valid confirm value is selected', async () => {
      const body = {
        confirm: YesNo.YES,
      }

      const requestObject = plainToInstance(ConfirmEdit, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
