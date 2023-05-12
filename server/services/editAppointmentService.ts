import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from './activitiesService'
import { AppointmentJourney, AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { AppointmentCancellationReason, EditApplyTo } from '../@types/appointments'
import { AppointmentOccurrenceCancelRequest, AppointmentOccurrenceUpdateRequest } from '../@types/activitiesAPI/types'
import SimpleDate from '../commonValidationTypes/simpleDate'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { convertToTitleCase, formatDate, fullName } from '../utils/utils'
import { YesNo } from '../@types/activities'

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

    this.clearSession(req)

    return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}`)
  }

  getEditMessage(req: Request) {
    const { appointmentJourney, editAppointmentJourney } = req.session

    if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED) {
      return 'cancel'
    }

    if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
      return 'delete'
    }

    const updateProperties = []
    if (this.hasLocationChanged(appointmentJourney, editAppointmentJourney)) {
      updateProperties.push('location')
    }

    if (this.hasStartDateChanged(appointmentJourney, editAppointmentJourney)) {
      updateProperties.push('date')
    }

    if (
      this.hasStartTimeChanged(appointmentJourney, editAppointmentJourney) ||
      this.hasEndTimeChanged(appointmentJourney, editAppointmentJourney)
    ) {
      updateProperties.push('time')
    }

    if (updateProperties.length > 0) {
      return `change the ${updateProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')} for`
    }

    if (editAppointmentJourney.addPrisoners?.length === 1) {
      return `add ${convertToTitleCase(editAppointmentJourney.addPrisoners[0].name)} to`
    }

    if (editAppointmentJourney.addPrisoners?.length > 1) {
      return 'add the prisoners to'
    }

    if (editAppointmentJourney.removePrisoner) {
      return `remove ${convertToTitleCase(fullName(editAppointmentJourney.removePrisoner))} from`
    }

    return ''
  }

  getEditedMessage(req: Request) {
    return this.getEditMessage(req)
      .replace('cancel', 'cancelled')
      .replace('delete', 'deleted')
      .replace('add', 'added')
      .replace('remove', 'removed')
      .replace('change', 'changed')
  }

  isFirstRemainingOccurrence(req: Request) {
    const { editAppointmentJourney } = req.session

    return (
      editAppointmentJourney.repeatCount - editAppointmentJourney.sequenceNumber + 1 ===
      editAppointmentJourney.occurrencesRemaining
    )
  }

  isSecondLastRemainingOccurrence(req: Request) {
    const { editAppointmentJourney } = req.session

    return editAppointmentJourney.sequenceNumber + 1 === editAppointmentJourney.repeatCount
  }

  isLastRemainingOccurrence(req: Request) {
    const { editAppointmentJourney } = req.session

    return editAppointmentJourney.sequenceNumber === editAppointmentJourney.repeatCount
  }

  getApplyToOptions(req: Request) {
    const { appointmentJourney, editAppointmentJourney } = req.session

    const applyToOptions = [EditApplyTo.THIS_OCCURRENCE]

    if (editAppointmentJourney.occurrencesRemaining > 1) {
      const isFirstRemainingOccurrence = this.isFirstRemainingOccurrence(req)
      const isLastRemainingOccurrence = this.isLastRemainingOccurrence(req)

      if (!isFirstRemainingOccurrence && !isLastRemainingOccurrence) {
        applyToOptions.push(EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)
      }

      if (!this.hasStartDateChanged(appointmentJourney, editAppointmentJourney) || isFirstRemainingOccurrence) {
        applyToOptions.push(EditApplyTo.ALL_FUTURE_OCCURRENCES)
      }
    }

    return applyToOptions
  }

  async edit(req: Request, res: Response, applyTo: EditApplyTo) {
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
          const successHeading = `You've ${this.getEditedMessage(req)} the ${
            appointmentJourney.category.description
          } appointment - ${formatDate(new Date(appointmentJourney.startDate.date), 'EEEE, d MMMM yyyy')}`

          this.clearSession(req)

          return res.redirectWithSuccess(`/appointments`, successHeading)
        }
        const successHeading = `You've ${this.getEditedMessage(req)} ${this.getAppliedToSeriesMessage(
          editAppointmentJourney,
          applyTo,
        )}`

        this.clearSession(req)

        return res.redirectWithSuccess(`/appointments/${appointmentId}`, successHeading)
      }

      const successHeading = `You've ${this.getEditedMessage(req)} ${this.getAppliedToAppointmentMessage(
        editAppointmentJourney,
        applyTo,
      )}`

      this.clearSession(req)

      return res.redirectWithSuccess(`/appointments/${appointmentId}/occurrence/${occurrenceId}`, successHeading)
    }

    const occurrenceUpdates = { applyTo } as AppointmentOccurrenceUpdateRequest

    if (this.hasLocationChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.internalLocationId = editAppointmentJourney.location.id
    }

    if (this.hasStartDateChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.startDate = plainToInstance(SimpleDate, editAppointmentJourney.startDate).toIsoString()
      // TODO: This is a hack as the API doesn't currently support apply to all future occurrences for date
      if (applyTo === EditApplyTo.ALL_FUTURE_OCCURRENCES) {
        occurrenceUpdates.applyTo = EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES
      }
    }

    if (this.hasStartTimeChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.startTime = plainToInstance(SimpleTime, editAppointmentJourney.startTime).toIsoString()
    }

    if (this.hasEndTimeChanged(appointmentJourney, editAppointmentJourney)) {
      occurrenceUpdates.endTime = plainToInstance(SimpleTime, editAppointmentJourney.endTime).toIsoString()
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

    const successHeading = `You've ${this.getEditedMessage(req)} ${this.getAppliedToAppointmentMessage(
      editAppointmentJourney,
      applyTo,
    )}`

    this.clearSession(req)

    return res.redirectWithSuccess(`/appointments/${appointmentId}/occurrence/${occurrenceId}`, successHeading)
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

  private getAppliedToAppointmentMessage(editAppointmentJourney: EditAppointmentJourney, applyTo: EditApplyTo) {
    switch (applyTo) {
      case EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES:
        return `appointments ${editAppointmentJourney.sequenceNumber} to ${editAppointmentJourney.repeatCount} in the series`
      case EditApplyTo.ALL_FUTURE_OCCURRENCES:
        return `appointments ${
          editAppointmentJourney.repeatCount - editAppointmentJourney.occurrencesRemaining + 1
        } to ${editAppointmentJourney.repeatCount} in the series`
      default:
        return 'this appointment'
    }
  }

  private getAppliedToSeriesMessage(editAppointmentJourney: EditAppointmentJourney, applyTo: EditApplyTo) {
    switch (applyTo) {
      case EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES:
        return `appointments ${editAppointmentJourney.sequenceNumber} to ${editAppointmentJourney.repeatCount} in this series`
      case EditApplyTo.ALL_FUTURE_OCCURRENCES:
        return `appointments ${
          editAppointmentJourney.repeatCount - editAppointmentJourney.occurrencesRemaining + 1
        } to ${editAppointmentJourney.repeatCount} in this series`
      default:
        return `appointment ${editAppointmentJourney.sequenceNumber} of ${editAppointmentJourney.repeatCount} in this series`
    }
  }

  private clearSession(req: Request) {
    req.session.appointmentJourney = null
    req.session.editAppointmentJourney = null
  }
}
