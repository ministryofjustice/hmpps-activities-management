import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import ApplyToRoutes, { ApplyTo } from './applyTo'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { AppointmentApplyTo, AppointmentFrequency } from '../../../../@types/appointments'
import { getAppointmentApplyToOptions, getRepeatFrequencyText } from '../../../../utils/editAppointmentUtils'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'

jest.mock('../../../../services/editAppointmentService')
jest.mock('../../../../services/metricsService')

const editAppointmentService = new EditAppointmentService(null) as jest.Mocked<EditAppointmentService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Edit Appointment - Apply To', () => {
  const handler = new ApplyToRoutes(editAppointmentService, metricsService)
  const weekTomorrow = addDays(new Date(), 8)
  let req: Request
  let res: Response
  const appointmentId = 2
  const property = 'location'

  beforeEach(() => {
    req = {
      session: {
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
        appointmentId,
        property,
      },
    } as unknown as Request

    res = {
      locals: {
        user: {},
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
      req.body = {
        applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
      }

      await handler.POST(req, res)

      expect(req.session.editAppointmentJourney.applyTo).toEqual(AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS)
      expect(editAppointmentService.edit).toHaveBeenCalledWith(
        req,
        res,
        AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
      )
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
