import { Response } from 'express'
import ActivitiesService from '../../services/activitiesService'
import { AppointmentJourney } from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditApplyTo } from '../../@types/appointments'
import { ServiceUser } from '../../@types/express'

export default class EditAppointmentUtils {
  constructor(private readonly activitiesService: ActivitiesService) {}

  isApplyToQuestionRequired(appointmentJourney: AppointmentJourney) {
    return this.getApplyToOptions(appointmentJourney).length > 1
  }

  async redirectOrEdit(
    appointmentId: number,
    occurrenceId: number,
    appointmentJourney: AppointmentJourney,
    property: string,
    user: ServiceUser,
    res: Response,
  ) {
    if (this.isApplyToQuestionRequired(appointmentJourney)) {
      return res.redirect(`/appointments/${appointmentId}/occurrence/${occurrenceId}/edit/${property}/apply-to`)
    }

    return this.edit(appointmentId, occurrenceId, appointmentJourney, property, EditApplyTo.THIS_OCCURRENCE, user, res)
  }

  getApplyToOptions(appointmentJourney: AppointmentJourney) {
    const applyToOptions = [EditApplyTo.THIS_OCCURRENCE]

    if (appointmentJourney.occurrencesRemaining > 1) {
      const isFirstRemainingOccurrence =
        appointmentJourney.repeatCount - appointmentJourney.sequenceNumber + 1 ===
        appointmentJourney.occurrencesRemaining

      const isLastRemainingOccurrence = appointmentJourney.sequenceNumber === appointmentJourney.repeatCount

      if (!isFirstRemainingOccurrence && !isLastRemainingOccurrence) {
        applyToOptions.push(EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES)
      }

      applyToOptions.push(EditApplyTo.ALL_FUTURE_OCCURRENCES)
    }

    return applyToOptions
  }

  async edit(
    appointmentId: number,
    occurrenceId: number,
    appointmentJourney: AppointmentJourney,
    property: string,
    applyTo: EditApplyTo,
    user: ServiceUser,
    res: Response,
  ) {
    switch (property) {
      case 'location':
        return this.editLocation(appointmentId, occurrenceId, appointmentJourney, applyTo, user, res)
      default:
        return res.redirect('back')
    }
  }

  async editLocation(
    appointmentId: number,
    occurrenceId: number,
    appointmentJourney: AppointmentJourney,
    applyTo: EditApplyTo,
    user: ServiceUser,
    res: Response,
  ) {
    await this.activitiesService.editAppointmentOccurrence(
      +occurrenceId,
      {
        internalLocationId: appointmentJourney.location.id,
        applyTo,
      },
      user,
    )

    return res.redirectWithSuccess(
      `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
      `Appointment location for ${this.getAppliedToMessage(applyTo, appointmentJourney)} changed successfully`,
    )
  }

  private getAppliedToMessage(applyTo: EditApplyTo, appointmentJourney: AppointmentJourney) {
    switch (applyTo) {
      case EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES:
        if (appointmentJourney.sequenceNumber + 1 === appointmentJourney.repeatCount) {
          return 'this and the following appointment in the series'
        }
        return 'this appointment and all the appointments after it in the series'
      case EditApplyTo.ALL_FUTURE_OCCURRENCES:
        if (appointmentJourney.repeatCount > appointmentJourney.occurrencesRemaining) {
          return 'all remaining appointments in the series'
        }
        return 'all appointments in the series'
      default:
        return 'this appointment'
    }
  }
}
