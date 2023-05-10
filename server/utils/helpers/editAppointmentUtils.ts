import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import ActivitiesService from '../../services/activitiesService'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
} from '../../routes/appointments/create-and-edit/appointmentJourney'
import { EditApplyTo } from '../../@types/appointments'
import { ServiceUser } from '../../@types/express'
import { AppointmentOccurrenceUpdateRequest } from '../../@types/activitiesAPI/types'
import SimpleDate from '../../commonValidationTypes/simpleDate'
import SimpleTime from '../../commonValidationTypes/simpleTime'

export default class EditAppointmentUtils {
  constructor(private readonly activitiesService: ActivitiesService) {}

  getBackLinkHref(appointmentJourney: AppointmentJourney, defaultBackLinkHref: string, req: Request) {
    if (
      appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
      req.params.appointmentId &&
      req.params.occurrenceId
    ) {
      return `/appointments/${req.params.appointmentId}/occurrence/${req.params.occurrenceId}`
    }

    return defaultBackLinkHref
  }

  isApplyToQuestionRequired(appointmentJourney: AppointmentJourney) {
    return (
      appointmentJourney.mode === AppointmentJourneyMode.EDIT && this.getApplyToOptions(appointmentJourney).length > 1
    )
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

    return this.edit(appointmentId, occurrenceId, appointmentJourney, EditApplyTo.THIS_OCCURRENCE, user, res)
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

      if (!appointmentJourney.updatedProperties?.includes('date') || isFirstRemainingOccurrence) {
        applyToOptions.push(EditApplyTo.ALL_FUTURE_OCCURRENCES)
      }
    }

    return applyToOptions
  }

  async edit(
    appointmentId: number,
    occurrenceId: number,
    appointmentJourney: AppointmentJourney,
    applyTo: EditApplyTo,
    user: ServiceUser,
    res: Response,
  ) {
    const occurrenceUpdates = { applyTo } as AppointmentOccurrenceUpdateRequest

    appointmentJourney.updatedProperties.forEach(property => {
      switch (property) {
        case 'location':
          occurrenceUpdates.internalLocationId = appointmentJourney.location.id
          break
        case 'date':
          occurrenceUpdates.startDate = plainToInstance(SimpleDate, appointmentJourney.startDate).toIsoString()
          // TODO: This is a hack as the API doesn't currently support apply to all future occurrences for date
          if (applyTo === EditApplyTo.ALL_FUTURE_OCCURRENCES) {
            occurrenceUpdates.applyTo = EditApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES
          }
          break
        case 'start time':
          occurrenceUpdates.startTime = plainToInstance(SimpleTime, appointmentJourney.startTime).toIsoString()
          break
        case 'end time':
          occurrenceUpdates.endTime = plainToInstance(SimpleTime, appointmentJourney.endTime).toIsoString()
          break
        default:
          break
      }
    })

    await this.activitiesService.editAppointmentOccurrence(+occurrenceId, occurrenceUpdates, user)

    const updated = appointmentJourney.updatedProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')
    return res.redirectWithSuccess(
      `/appointments/${appointmentId}/occurrence/${occurrenceId}`,
      `${updated[0].toUpperCase() + updated.slice(1)} for ${this.getAppliedToMessage(
        applyTo,
        appointmentJourney,
      )} changed successfully`,
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
