import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import ConfirmEditRoutes, { ConfirmEdit } from './confirmEdit'
import { YesNo } from '../../../../@types/activities'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentApplyTo, AppointmentCancellationReason } from '../../../../@types/appointments'
import MetricsEvent, { MetricsEventType } from '../../../../data/metricsEvent'
import MetricsService from '../../../../services/metricsService'

jest.mock('../../../../services/editAppointmentService')
jest.mock('../../../../services/metricsService')

const editAppointmentService = new EditAppointmentService(null) as jest.Mocked<EditAppointmentService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Edit Appointment - Confirm', () => {
  const handler = new ConfirmEditRoutes(editAppointmentService, metricsService)
  const weekTomorrow = addDays(new Date(), 8)
  let req: Request
  let res: Response
  const journeyId = uuidv4()
  const appointmentId = 2

  beforeEach(() => {
    req = {
      session: {
        journeyMetrics: {
          journeyStartTime: Date.now() - 60000,
        },
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
          numberOfAppointments: 1,
          appointments: [
            {
              sequenceNumber: 2,
              startDate: format(addDays(weekTomorrow, 1), 'yyyy-MM-dd'),
            },
          ],
          sequenceNumber: 2,
          applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
        } as EditAppointmentJourney,
      },
      params: {
        journeyId,
        appointmentId,
      },
    } as unknown as Request

    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('should render the confirm edit view with params and session data', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/confirm-edit', {
        appointmentId,
        startDate: new Date(req.session.appointmentJourney.startDate.date),
      })
    })
  })

  describe('POST', () => {
    it('should redirect to appointment details page', async () => {
      req.session.editAppointmentJourney.property = 'location'
      req.body = {
        confirm: YesNo.NO,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('property', 'location')
          .addProperty('isApplyToQuestionRequired', 'false')
          .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
          .addMeasurement('journeyTimeSec', 60),
      )

      expect(res.redirect).toHaveBeenCalledWith(`/appointments/${appointmentId}`)
    })

    it('should edit', async () => {
      req.session.editAppointmentJourney.property = 'date-and-time'
      req.body = {
        confirm: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('property', 'date-and-time')
          .addProperty('isApplyToQuestionRequired', 'false')
          .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
          .addMeasurement('journeyTimeSec', 60),
      )

      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    })

    it('should cancel', async () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED
      req.body = {
        confirm: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('isDelete', 'false')
          .addProperty('isApplyToQuestionRequired', 'false')
          .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
          .addMeasurement('journeyTimeSec', 60),
      )

      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    })

    it('should delete', async () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR
      req.body = {
        confirm: YesNo.YES,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('isDelete', 'true')
          .addProperty('isApplyToQuestionRequired', 'false')
          .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
          .addMeasurement('journeyTimeSec', 60),
      )

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
