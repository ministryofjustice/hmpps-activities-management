import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import ConfirmEditRoutes, { ConfirmEdit } from './confirmEdit'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentApplyTo } from '../../../../@types/appointments'

jest.mock('../../../../services/editAppointmentService')

const editAppointmentService = new EditAppointmentService(null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Create Appointment - Repeat', () => {
  const handler = new ConfirmEditRoutes(editAppointmentService)
  const weekTomorrow = addDays(new Date(), 8)
  let req: Request
  let res: Response
  const appointmentId = 1
  const occurrenceId = 2

  beforeEach(() => {
    req = {
      session: {
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.INDIVIDUAL,
          startDate: {
            day: weekTomorrow.getDate(),
            month: weekTomorrow.getMonth() + 1,
            year: weekTomorrow.getFullYear(),
            date: weekTomorrow,
          },
        },
        editAppointmentJourney: {
          repeatCount: 4,
          sequenceNumbers: [1, 2, 3, 4],
          sequenceNumber: 2,
          applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
        } as EditAppointmentJourney,
      },
      params: {
        appointmentId,
        occurrenceId,
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
        occurrenceId,
        startDate: new Date(req.session.appointmentJourney.startDate.date),
      })
    })
  })

  describe('POST', () => {
    it('should redirect to occurrence details page', async () => {
      req.body = {
        confirm: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
    })

    it('should edit', async () => {
      req.body = {
        confirm: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.THIS_OCCURRENCE)
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
