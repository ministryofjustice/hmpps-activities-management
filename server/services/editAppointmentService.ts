import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from './activitiesService'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentApplyTo } from '../@types/appointments'
import { AppointmentCancelRequest, AppointmentUpdateRequest } from '../@types/activitiesAPI/types'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { YesNo } from '../@types/activities'
import {
  getAppointmentEditMessage,
  hasAnyAppointmentPropertyChanged,
  hasAppointmentCommentChanged,
  hasAppointmentEndTimeChanged,
  hasAppointmentLocationChanged,
  hasAppointmentStartDateChanged,
  hasAppointmentStartTimeChanged,
  isApplyToQuestionRequired,
  getLastAppointment,
  getFirstAppointment,
  applyToAppointmentCount,
  hasAppointmentTierChanged,
  hasAppointmentOrganiserChanged,
} from '../utils/editAppointmentUtils'
import config from '../config'
import MetricsService from './metricsService'
import MetricsEvent from '../data/metricsEvent'

export default class EditAppointmentService {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly metricsService: MetricsService,
  ) {}

  async redirectOrEdit(req: Request, res: Response, property: string) {
    const { appointmentId } = req.params
    if (hasAnyAppointmentPropertyChanged(req.session.appointmentJourney, req.session.editAppointmentJourney)) {
      if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
        return res.redirect(`${property}/apply-to`)
      }

      return this.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    }

    this.metricsService.trackEvent(
      MetricsEvent.EDIT_APPOINTMENT_JOURNEY_COMPLETED(
        +appointmentId,
        false,
        AppointmentApplyTo.THIS_APPOINTMENT,
        req,
        res.locals.user,
      ),
    )

    this.clearSession(req)

    return res.redirect(`/appointments/${appointmentId}`)
  }

  async edit(req: Request, res: Response, applyTo: AppointmentApplyTo) {
    const { user } = res.locals
    const { appointmentJourney, editAppointmentJourney } = req.session
    const { appointmentId } = req.params

    if (editAppointmentJourney.cancellationReason) {
      const { cancellationReason } = editAppointmentJourney

      const cancelRequest: AppointmentCancelRequest = {
        cancellationReasonId: +cancellationReason,
        applyTo,
      }

      await this.activitiesService.cancelAppointment(+appointmentId, cancelRequest, user)

      this.metricsService.trackEvent(
        MetricsEvent.CANCEL_APPOINTMENT_JOURNEY_COMPLETED(+appointmentId, applyTo, req, res.locals.user),
      )

      this.clearSession(req)

      return res.redirect(`/appointments/${appointmentId}`)
    }

    const request = { applyTo } as AppointmentUpdateRequest

    if (hasAppointmentTierChanged(appointmentJourney, editAppointmentJourney)) {
      request.tierCode = editAppointmentJourney.tierCode
    }

    if (hasAppointmentOrganiserChanged(appointmentJourney, editAppointmentJourney)) {
      request.organiserCode = editAppointmentJourney.organiserCode
    }

    if (hasAppointmentLocationChanged(appointmentJourney, editAppointmentJourney)) {
      request.internalLocationId = editAppointmentJourney.location?.id
      request.inCell = editAppointmentJourney.inCell
    }

    if (hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)) {
      request.startDate = editAppointmentJourney.startDate
      // TODO: This is a hack as the API doesn't currently support apply to all future appointments for date
      if (applyTo === AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS) {
        request.applyTo = AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS
      }
    }

    if (hasAppointmentStartTimeChanged(appointmentJourney, editAppointmentJourney)) {
      request.startTime = plainToInstance(SimpleTime, editAppointmentJourney.startTime).toIsoString()
    }

    if (hasAppointmentEndTimeChanged(appointmentJourney, editAppointmentJourney)) {
      request.endTime = plainToInstance(SimpleTime, editAppointmentJourney.endTime).toIsoString()
    }

    if (hasAppointmentCommentChanged(appointmentJourney, editAppointmentJourney)) {
      request.extraInformation = editAppointmentJourney.extraInformation
    }

    if (editAppointmentJourney.addPrisoners?.length > 0) {
      const { maxAppointmentInstances } = config.appointmentsConfig
      const numberOfAppointments = applyToAppointmentCount(applyTo, editAppointmentJourney)
      const maxPrisoners = Math.floor(maxAppointmentInstances / numberOfAppointments)

      if (editAppointmentJourney.addPrisoners.length > maxPrisoners) {
        return res.validationFailed(
          'applyTo',
          `You cannot add more than ${maxPrisoners} attendees for this number of appointments.`,
        )
      }
      request.addPrisonerNumbers = editAppointmentJourney.addPrisoners.map(prisoner => prisoner.number)
    }

    if (editAppointmentJourney.removePrisoner) {
      request.removePrisonerNumbers = [editAppointmentJourney.removePrisoner.prisonerNumber]
    }

    await this.activitiesService.editAppointment(+appointmentId, request, user)

    this.metricsService.trackEvent(
      MetricsEvent.EDIT_APPOINTMENT_JOURNEY_COMPLETED(+appointmentId, true, applyTo, req, res.locals.user),
    )

    const successHeading = `You've ${this.getEditedMessage(
      appointmentJourney,
      editAppointmentJourney,
    )} ${this.getAppliedToAppointmentMessage(editAppointmentJourney, appointmentJourney, applyTo)}`

    this.clearSession(req)

    return res.redirectWithSuccess(`/appointments/${appointmentId}`, successHeading)
  }

  private getEditedMessage(appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) {
    return getAppointmentEditMessage(appointmentJourney, editAppointmentJourney)
      .replace('cancel', 'cancelled')
      .replace('delete', 'deleted')
      .replace('add', 'added')
      .replace('remove', 'removed')
      .replace('change', 'changed')
  }

  private getAppliedToAppointmentMessage(
    editAppointmentJourney: EditAppointmentJourney,
    appointmentJourney: AppointmentJourney,
    applyTo: AppointmentApplyTo,
    backToSeries = false,
  ) {
    if (appointmentJourney.repeat === YesNo.YES) {
      switch (applyTo) {
        case AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS:
          return `appointments ${editAppointmentJourney.sequenceNumber} to ${
            getLastAppointment(editAppointmentJourney).sequenceNumber
          } in ${backToSeries ? 'this' : 'the'} series`
        case AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS:
          return `appointments ${getFirstAppointment(editAppointmentJourney).sequenceNumber} to ${
            getLastAppointment(editAppointmentJourney).sequenceNumber
          } in ${backToSeries ? 'this' : 'the'} series`
        default:
          if (backToSeries) {
            return `appointment ${editAppointmentJourney.sequenceNumber} of ${
              getLastAppointment(editAppointmentJourney).sequenceNumber
            } in this series`
          }
      }
    }
    return 'this appointment'
  }

  private clearSession(req: Request) {
    req.session.editAppointmentJourney = null
    req.session.appointmentJourney = null
    req.session.journeyMetrics = null
  }
}
