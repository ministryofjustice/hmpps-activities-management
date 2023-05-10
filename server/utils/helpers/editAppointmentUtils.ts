import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../services/activitiesService'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
} from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../../routes/appointments/create-and-edit/editAppointmentJourney'
import { EditApplyTo } from '../../@types/appointments'
import { AppointmentOccurrenceUpdateRequest } from '../../@types/activitiesAPI/types'
import SimpleDate from '../../commonValidationTypes/simpleDate'
import SimpleTime from '../../commonValidationTypes/simpleTime'

export default class EditAppointmentUtils {
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

  isApplyToQuestionRequired(req: Request) {
    return this.getApplyToOptions(req).length > 1
  }

  async redirectOrEdit(req: Request, res: Response, property: string) {
    const { appointmentId, occurrenceId } = req.params
    if (this.hasAnyPropertyChanged(req.session.appointmentJourney, req.session.editAppointmentJourney)) {
      if (this.isApplyToQuestionRequired(req)) {
        return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/${property}/apply-to`)
      }

      return this.edit(req, res, EditApplyTo.THIS_OCCURRENCE)
    }

    req.session.appointmentJourney = null
    req.session.editAppointmentJourney = null

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }

  getApplyToOptions(req: Request) {
    const { editAppointmentJourney } = req.session

    const applyToOptions = [EditApplyTo.THIS_OCCURRENCE]

    if (editAppointmentJourney.occurrencesRemaining > 1) {
      const isFirstRemainingOccurrence =
        editAppointmentJourney.repeatCount - editAppointmentJourney.sequenceNumber + 1 ===
        editAppointmentJourney.occurrencesRemaining

      const isLastRemainingOccurrence = editAppointmentJourney.sequenceNumber === editAppointmentJourney.repeatCount

      if (!isFirstRemainingOccurrence && !isLastRemainingOccurrence) {
        applyToOptions.push(EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)
      }

      if (!editAppointmentJourney.startDate || isFirstRemainingOccurrence) {
        applyToOptions.push(EditApplyTo.ALL_FUTURE_OCCURRENCES)
      }
    }

    return applyToOptions
  }

  async edit(req: Request, res: Response, applyTo: EditApplyTo) {
    const { user } = res.locals
    const { appointmentJourney, editAppointmentJourney } = req.session
    const { appointmentId, occurrenceId } = req.params

    const occurrenceUpdates = { applyTo } as AppointmentOccurrenceUpdateRequest

    const updatedProperties = []

    if (this.hasLocationChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.internalLocationId = editAppointmentJourney.location.id
      updatedProperties.push('location')
    }

    if (this.hasStartDateChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.startDate = plainToInstance(SimpleDate, editAppointmentJourney.startDate).toIsoString()
      // TODO: This is a hack as the API doesn't currently support apply to all future occurrences for date
      if (applyTo === EditApplyTo.ALL_FUTURE_OCCURRENCES) {
        occurrenceUpdates.applyTo = EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES
      }
      updatedProperties.push('date')
    }

    if (this.hasStartTimeChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.startTime = plainToInstance(SimpleTime, editAppointmentJourney.startTime).toIsoString()
      updatedProperties.push('start time')
    }

    if (this.hasEndTimeChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.endTime = plainToInstance(SimpleTime, editAppointmentJourney.endTime).toIsoString()
      updatedProperties.push('end time')
    }

    await this.activitiesService.editAppointmentOccurrence(+occurrenceId, occurrenceUpdates, user)

    req.session.appointmentJourney = null
    req.session.editAppointmentJourney = null

    const updated = updatedProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')
    res.redirectWithSuccess(
      `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
      `${updated[0].toUpperCase() + updated.slice(1)} for ${this.getAppliedToMessage(
        editAppointmentJourney,
        applyTo,
      )} changed successfully`,
    )
  }

  private hasAnyPropertyChanged(
    appointmentJourney: AppointmentJourney,
    editAppointmentJourney: EditAppointmentJourney,
  ) {
    return (
      this.hasLocationChanged(appointmentJourney, editAppointmentJourney) ||
      this.hasStartDateChanged(appointmentJourney, editAppointmentJourney) ||
      this.hasStartTimeChanged(appointmentJourney, editAppointmentJourney) ||
      this.hasEndTimeChanged(appointmentJourney, editAppointmentJourney)
    )
  }

  private hasLocationChanged(appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) {
    return editAppointmentJourney.location && appointmentJourney.location.id !== editAppointmentJourney.location.id
  }

  private hasStartDateChanged(appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) {
    const { startDate } = appointmentJourney
    const editStartDate = editAppointmentJourney.startDate
    return (
      editStartDate &&
      (startDate.day !== editStartDate.day ||
        startDate.month !== editStartDate.month ||
        startDate.year !== editStartDate.year)
    )
  }

  private hasStartTimeChanged(appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) {
    const { startTime } = appointmentJourney
    const editStartTime = editAppointmentJourney.startTime
    return editStartTime && (startTime.hour !== editStartTime.hour || startTime.minute !== editStartTime.minute)
  }

  private hasEndTimeChanged(appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) {
    const { endTime } = appointmentJourney
    const editEndTime = editAppointmentJourney.endTime
    return editEndTime && (endTime.hour !== editEndTime.hour || endTime.minute !== editEndTime.minute)
  }

  private getAppliedToMessage(editAppointmentJourney: EditAppointmentJourney, applyTo: EditApplyTo) {
    switch (applyTo) {
      case EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES:
        if (editAppointmentJourney.sequenceNumber + 1 === editAppointmentJourney.repeatCount) {
          return 'this and the following appointment in the series'
        }
        return 'this appointment and all the appointments after it in the series'
      case EditApplyTo.ALL_FUTURE_OCCURRENCES:
        if (editAppointmentJourney.repeatCount > editAppointmentJourney.occurrencesRemaining) {
          return 'all remaining appointments in the series'
        }
        return 'all appointments in the series'
      default:
        return 'this appointment'
    }
  }
}
