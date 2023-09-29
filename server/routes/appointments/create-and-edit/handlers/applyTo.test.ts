import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import ApplyToRoutes, { ApplyTo } from './applyTo'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import {
  AppointmentApplyTo,
  AppointmentCancellationReason,
  AppointmentFrequency,
} from '../../../../@types/appointments'
import { getAppointmentApplyToOptions, getRepeatFrequencyText } from '../../../../utils/editAppointmentUtils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent, { MetricsEventType } from '../../../../data/metricsEvent'

jest.mock('../../../../services/editAppointmentService')
jest.mock('../../../../services/metricsService')

const editAppointmentService = new EditAppointmentService(null) as jest.Mocked<EditAppointmentService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Edit Appointment - Apply To', () => {
  const handler = new ApplyToRoutes(editAppointmentService, metricsService)
  const weekTomorrow = addDays(new Date(), 8)
  let req: Request
  let res: Response
  const journeyId = uuidv4()
  const appointmentId = 2
  const property = 'location'

  beforeEach(() => {
    req = {
      session: {
        journeyMetrics: {
          journeyStartTime: Date.now() - 60000,
        },
        appointmentJourney: {
          mode: AppointmentJourneyMode.EDIT,
          type: AppointmentType.GROUP,
          repeatFrequency: AppointmentFrequency.DAILY,
          startDate: {
            day: weekTomorrow.getDate(),
            month: weekTomorrow.getMonth() + 1,
            year: weekTomorrow.getFullYear(),
            date: weekTomorrow,
          },
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
        } as EditAppointmentJourney,
      },
      params: {
        journeyId,
        appointmentId,
        property,
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
    } as unknown as Response
  })

  describe('GET', () => {
    it('should render the apply to view with params and session data', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/apply-to', {
        appointmentId,
        property,
        applyToOptions: getAppointmentApplyToOptions(req),
        frequencyText: getRepeatFrequencyText(req.session.appointmentJourney),
      })
    })
  })

  describe('POST', () => {
    it('should save apply to in session and edit', async () => {
      req.session.editAppointmentJourney.property = 'extra-information'
      req.body = {
        applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.EDIT_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('property', 'extra-information')
          .addProperty('isApplyToQuestionRequired', 'true')
          .addProperty('applyTo', AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
          .addMeasurement('journeyTimeSec', 60),
      )

      expect(req.session.editAppointmentJourney.applyTo).toEqual(AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
      expect(editAppointmentService.edit).toHaveBeenCalledWith(
        req,
        res,
        AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
      )
    })

    it('should save apply to in session and cancel', async () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CANCELLED
      req.body = {
        applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('isDelete', 'false')
          .addProperty('isApplyToQuestionRequired', 'true')
          .addProperty('applyTo', AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
          .addMeasurement('journeyTimeSec', 60),
      )

      expect(req.session.editAppointmentJourney.applyTo).toEqual(AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS)
    })

    it('should save apply to in session and delete', async () => {
      req.session.editAppointmentJourney.cancellationReason = AppointmentCancellationReason.CREATED_IN_ERROR
      req.body = {
        applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
      }

      await handler.POST(req, res)

      expect(req.session.journeyMetrics).toBeNull()
      expect(metricsService.trackEvent).toBeCalledWith(
        new MetricsEvent(MetricsEventType.CANCEL_APPOINTMENT_JOURNEY_COMPLETED, res.locals.user)
          .addProperty('journeyId', journeyId)
          .addProperty('appointmentId', appointmentId)
          .addProperty('isDelete', 'true')
          .addProperty('isApplyToQuestionRequired', 'true')
          .addProperty('applyTo', AppointmentApplyTo.THIS_APPOINTMENT)
          .addMeasurement('journeyTimeSec', 60),
      )

      expect(req.session.editAppointmentJourney.applyTo).toEqual(AppointmentApplyTo.THIS_APPOINTMENT)
      expect(editAppointmentService.edit).toHaveBeenCalledWith(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    })
  })

  describe('Validation', () => {
    it('validation fails when no apply to value is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(ApplyTo, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select how this change should be applied to the remaining appointments in the series',
            property: 'applyTo',
          },
        ]),
      )
    })

    it('validation fails when invalid apply to value is selected', async () => {
      const body = {
        applyTo: 'EVERYTHING',
      }

      const requestObject = plainToInstance(ApplyTo, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Select how this change should be applied to the remaining appointments in the series',
            property: 'applyTo',
          },
        ]),
      )
    })

    it('passes validation when valid apply to value is selected', async () => {
      const body = {
        applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
      }

      const requestObject = plainToInstance(ApplyTo, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
