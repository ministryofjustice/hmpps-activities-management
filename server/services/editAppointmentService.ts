import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from './activitiesService'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason, AppointmentApplyTo } from '../@types/appointments'
import { AppointmentCancelRequest, AppointmentUpdateRequest } from '../@types/activitiesAPI/types'
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
  getLastAppointment,
  getFirstAppointment,
} from '../utils/editAppointmentUtils'

export default class EditAppointmentService {
  constructor(private readonly activitiesService: ActivitiesService) {}

  async redirectOrEdit(req: Request, res: Response, property: string) {
    const { appointmentSeriesId, appointmentId } = req.params
    if (hasAnyAppointmentPropertyChanged(req.session.appointmentJourney, req.session.editAppointmentJourney)) {
      if (isApplyToQuestionRequired(req.session.editAppointmentJourney)) {
        return res.redirect(`${property}/apply-to`)
      }

      return this.edit(req, res, AppointmentApplyTo.THIS_APPOINTMENT)
    }

    this.clearSession(req)

    return res.redirect(`/appointments/${appointmentId}`)
  }

  async edit(req: Request, res: Response, applyTo: AppointmentApplyTo) {
    const { user } = res.locals
    const { appointmentJourney, editAppointmentJourney } = req.session
    const { appointmentSeriesId, appointmentId } = req.params

    if (editAppointmentJourney.cancellationReason) {
      const { repeat } = appointmentJourney
      const { cancellationReason, appointmentSet } = editAppointmentJourney

      const cancelRequest: AppointmentCancelRequest = {
        cancellationReasonId: +cancellationReason,
        applyTo,
      }

      await this.activitiesService.cancelAppointment(+appointmentId, cancelRequest, user)

      // For delete requests we can't redirect back to the appointment page. Instead, we should provide a more specific
      // error message and redirect back to a relevant page
      if (cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
        if (appointmentSet) {
          const successHeading = `You've ${this.getEditedMessage(
            appointmentJourney,
            editAppointmentJourney,
          )} appointment for ${appointmentJourney.prisoners[0].number} from this set`

          const appointmentSetId = appointmentSet.id

          this.clearSession(req)

          return res.redirectWithSuccess(`/appointments/bulk-appointments/${appointmentSetId}`, successHeading)
        }
        if (repeat === YesNo.YES) {
          const successHeading = `You've ${this.getEditedMessage(
            appointmentJourney,
            editAppointmentJourney,
          )} ${this.getAppliedToAppointmentMessage(editAppointmentJourney, appointmentJourney, applyTo, true)}`

          this.clearSession(req)

          return res.redirectWithSuccess(`/appointments/${appointmentSeriesId}`, successHeading)
        }
        const successHeading = `You've ${this.getEditedMessage(appointmentJourney, editAppointmentJourney)} the ${
          appointmentJourney.appointmentName
        } appointment - ${formatDate(new Date(appointmentJourney.startDate.date), 'EEEE, d MMMM yyyy')}`

        this.clearSession(req)

        return res.redirectWithSuccess(`/appointments`, successHeading)
      }

      this.clearSession(req)

      return res.redirect(`/appointments/${appointmentId}`)
    }

    const request = { applyTo } as AppointmentUpdateRequest

    if (hasAppointmentLocationChanged(appointmentJourney, editAppointmentJourney)) {
      request.internalLocationId = editAppointmentJourney.location.id
    }

    if (hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)) {
      request.startDate = plainToInstance(SimpleDate, editAppointmentJourney.startDate).toIsoString()
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
      request.addPrisonerNumbers = editAppointmentJourney.addPrisoners.map(prisoner => prisoner.number)
    }

    if (editAppointmentJourney.removePrisoner) {
      request.removePrisonerNumbers = [editAppointmentJourney.removePrisoner.prisonerNumber]
    }

    await this.activitiesService.editAppointment(+appointmentId, request, user)

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
    req.session.appointmentJourney = null
    req.session.editAppointmentJourney = null
  }
}
