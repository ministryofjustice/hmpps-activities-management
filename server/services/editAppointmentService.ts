import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from './activitiesService'
import { AppointmentJourney, AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason, AppointmentApplyTo } from '../@types/appointments'
import { AppointmentOccurrenceCancelRequest, AppointmentOccurrenceUpdateRequest } from '../@types/activitiesAPI/types'
import SimpleDate from '../commonValidationTypes/simpleDate'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { formatDate } from '../utils/utils'
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
  maxAppointmentSequenceNumber,
  minAppointmentSequenceNumber,
} from '../utils/editAppointmentUtils'

export default class EditAppointmentService {
  constructor(private readonly activitiesService: ActivitiesService) {}

  getBackLinkHref(req: Request, defaultBackLinkHref: string) {
    if (
      req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
      req.params.appointmentId &&
      req.params.occurrenceId
    ) {
      return `/appointments/${req.params.appointmentId}/occurrence/${req.params.occurrenceId}`
    }

    return defaultBackLinkHref
  }

  async redirectOrEdit(req: Request, res: Response, property: string) {
    const { appointmentId, occurrenceId } = req.params
    if (hasAnyAppointmentPropertyChanged(req.session.appointmentJourney, req.session.editAppointmentJourney)) {
      if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
        return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/${property}/apply-to`)
      }

      return this.edit(req, res, AppointmentApplyTo.THIS_OCCURRENCE)
    }

    this.clearSession(req)

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }

  async edit(req: Request, res: Response, applyTo: AppointmentApplyTo) {
    const { user } = res.locals
    const { appointmentJourney, editAppointmentJourney } = req.session
    const { appointmentId, occurrenceId } = req.params

    if (editAppointmentJourney.cancellationReason) {
      const { repeat } = appointmentJourney
      const { cancellationReason } = editAppointmentJourney

      const cancelRequest = {
        cancellationReasonId: +cancellationReason,
        applyTo,
      } as AppointmentOccurrenceCancelRequest

      await this.activitiesService.cancelAppointmentOccurrence(+occurrenceId, cancelRequest, user)

      if (cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
        if (repeat === YesNo.NO) {
          const successHeading = `You've ${this.getEditedMessage(appointmentJourney, editAppointmentJourney)} the ${
            appointmentJourney.category.description
          } appointment - ${formatDate(new Date(appointmentJourney.startDate.date), 'EEEE, d MMMM yyyy')}`

          this.clearSession(req)

          return res.redirectWithSuccess(`/appointments`, successHeading)
        }
        const successHeading = `You've ${this.getEditedMessage(
          appointmentJourney,
          editAppointmentJourney,
        )} ${this.getAppliedToSeriesMessage(editAppointmentJourney, applyTo)}`

        this.clearSession(req)

        return res.redirectWithSuccess(`/appointments/${appointmentId}`, successHeading)
      }

      const successHeading = `You've ${this.getEditedMessage(
        appointmentJourney,
        editAppointmentJourney,
      )} ${this.getAppliedToAppointmentMessage(editAppointmentJourney, applyTo)}`

      this.clearSession(req)

      return res.redirectWithSuccess(`/appointments/${appointmentId}/occurrence/${occurrenceId}`, successHeading)
    }

    const occurrenceUpdates = { applyTo } as AppointmentOccurrenceUpdateRequest

    if (hasAppointmentLocationChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.internalLocationId = editAppointmentJourney.location.id
    }

    if (hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.startDate = plainToInstance(SimpleDate, editAppointmentJourney.startDate).toIsoString()
      // TODO: This is a hack as the API doesn't currently support apply to all future occurrences for date
      if (applyTo === AppointmentApplyTo.ALL_FUTURE_OCCURRENCES) {
        occurrenceUpdates.applyTo = AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES
      }
    }

    if (hasAppointmentStartTimeChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.startTime = plainToInstance(SimpleTime, editAppointmentJourney.startTime).toIsoString()
    }

    if (hasAppointmentEndTimeChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.endTime = plainToInstance(SimpleTime, editAppointmentJourney.endTime).toIsoString()
    }

    if (hasAppointmentCommentChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.comment = editAppointmentJourney.comment
    }

    if (editAppointmentJourney.addPrisoners?.length > 0) {
      occurrenceUpdates.prisonerNumbers = appointmentJourney.prisoners
        .concat(editAppointmentJourney.addPrisoners)
        .map(prisoner => prisoner.number)
    }

    if (editAppointmentJourney.removePrisoner) {
      occurrenceUpdates.prisonerNumbers = appointmentJourney.prisoners
        .filter(prisoner => prisoner.number !== editAppointmentJourney.removePrisoner.prisonerNumber)
        .map(prisoner => prisoner.number)
    }

    await this.activitiesService.editAppointmentOccurrence(+occurrenceId, occurrenceUpdates, user)

    const successHeading = `You've ${this.getEditedMessage(
      appointmentJourney,
      editAppointmentJourney,
    )} ${this.getAppliedToAppointmentMessage(editAppointmentJourney, applyTo)}`

    this.clearSession(req)

    return res.redirectWithSuccess(`/appointments/${appointmentId}/occurrence/${occurrenceId}`, successHeading)
  }

  private getEditedMessage(appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) {
    return getAppointmentEditMessage(appointmentJourney, editAppointmentJourney)
      .replace('cancel', 'cancelled')
      .replace('delete', 'deleted')
      .replace('add', 'added')
      .replace('remove', 'removed')
      .replace('change', 'changed')
  }

  private getAppliedToAppointmentMessage(editAppointmentJourney: EditAppointmentJourney, applyTo: AppointmentApplyTo) {
    switch (applyTo) {
      case AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES:
        return `appointments ${editAppointmentJourney.sequenceNumber} to ${maxAppointmentSequenceNumber(
          editAppointmentJourney,
        )} in the series`
      case AppointmentApplyTo.ALL_FUTURE_OCCURRENCES:
        return `appointments ${minAppointmentSequenceNumber(editAppointmentJourney)} to ${maxAppointmentSequenceNumber(
          editAppointmentJourney,
        )} in the series`
      default:
        return 'this appointment'
    }
  }

  private getAppliedToSeriesMessage(editAppointmentJourney: EditAppointmentJourney, applyTo: AppointmentApplyTo) {
    switch (applyTo) {
      case AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES:
        return `appointments ${editAppointmentJourney.sequenceNumber} to ${maxAppointmentSequenceNumber(
          editAppointmentJourney,
        )} in this series`
      case AppointmentApplyTo.ALL_FUTURE_OCCURRENCES:
        return `appointments ${minAppointmentSequenceNumber(editAppointmentJourney)} to ${maxAppointmentSequenceNumber(
          editAppointmentJourney,
        )} in this series`
      default:
        return `appointment ${editAppointmentJourney.sequenceNumber} of ${maxAppointmentSequenceNumber(
          editAppointmentJourney,
        )} in this series`
    }
  }

  private clearSession(req: Request) {
    req.session.appointmentJourney = null
    req.session.editAppointmentJourney = null
  }
}
