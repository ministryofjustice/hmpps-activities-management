import { Request } from 'express'
import { AppointmentApplyTo, AppointmentApplyToOption, AppointmentCancellationReason } from '../@types/appointments'
import { formatDate } from './utils'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'

export const isApplyToQuestionRequired = (editAppointmentJourney: EditAppointmentJourney) =>
  Array.isArray(editAppointmentJourney.sequenceNumbers) && editAppointmentJourney.sequenceNumbers.length > 1

export const getAppointmentApplyToOptions = (req: Request) => {
  const { appointmentJourney, editAppointmentJourney } = req.session

  const applyToOptions = [
    {
      applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
      description: `Just this one - ${formatDate(new Date(appointmentJourney.startDate.date), 'EEEE, d MMMM yyyy')} (${
        editAppointmentJourney.sequenceNumber
      } of ${maxSequenceNumber(editAppointmentJourney)})`,
    },
  ] as AppointmentApplyToOption[]

  if (isApplyToQuestionRequired(editAppointmentJourney)) {
    if (isFirstRemainingOccurrence(editAppointmentJourney) || !isLastRemainingOccurrence(editAppointmentJourney)) {
      applyToOptions.push({
        applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
        description: isSecondLastRemainingOccurrence(editAppointmentJourney)
          ? 'This one and the appointment that comes after it in the series'
          : 'This one and all the appointments that come after it in the series',
        additionalDescription: `You’re ${getEditHintAction(appointmentJourney, editAppointmentJourney)} appointments ${
          editAppointmentJourney.sequenceNumber
        } to ${maxSequenceNumber(editAppointmentJourney)}`,
      })
    }

    if (
      !isFirstRemainingOccurrence(editAppointmentJourney) &&
      !hasStartDateChanged(appointmentJourney, editAppointmentJourney)
    ) {
      applyToOptions.push({
        applyTo: AppointmentApplyTo.ALL_FUTURE_OCCURRENCES,
        description: 'This one and all the appointments in the series that haven’t happened yet',
        additionalDescription: `You’re ${getEditHintAction(
          appointmentJourney,
          editAppointmentJourney,
        )} appointments ${minSequenceNumber(editAppointmentJourney)} to ${maxSequenceNumber(editAppointmentJourney)}`,
      })
    }
  }

  return applyToOptions
}

const getEditHintAction = (appointmentJourney: AppointmentJourney, editAppointmentJourney: EditAppointmentJourney) => {
  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED) {
    return 'cancelling'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'deleting'
  }

  if (editAppointmentJourney.addPrisoners?.length === 1) {
    return 'adding this person to'
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'adding these people to'
  }

  if (editAppointmentJourney.removePrisoner) {
    return 'removing this person from'
  }

  return 'changing'
}

const minSequenceNumber = (editAppointmentJourney: EditAppointmentJourney) =>
  Array.isArray(editAppointmentJourney.sequenceNumbers) && editAppointmentJourney.sequenceNumbers.length
    ? Math.min(...editAppointmentJourney.sequenceNumbers)
    : editAppointmentJourney.sequenceNumber

const maxSequenceNumber = (editAppointmentJourney: EditAppointmentJourney) =>
  Array.isArray(editAppointmentJourney.sequenceNumbers) && editAppointmentJourney.sequenceNumbers.length
    ? Math.max(...editAppointmentJourney.sequenceNumbers)
    : editAppointmentJourney.repeatCount

const isFirstRemainingOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.sequenceNumber === minSequenceNumber(editAppointmentJourney)

const isSecondLastRemainingOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  Array.isArray(editAppointmentJourney.sequenceNumbers) &&
  editAppointmentJourney.sequenceNumbers.length > 2 &&
  editAppointmentJourney.sequenceNumber ===
    editAppointmentJourney.sequenceNumbers[editAppointmentJourney.sequenceNumbers.length - 2]

const isLastRemainingOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.sequenceNumber === maxSequenceNumber(editAppointmentJourney)

const hasStartDateChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  const { startDate } = appointmentJourney
  const editStartDate = editAppointmentJourney.startDate
  return (
    editStartDate &&
    (startDate.day !== editStartDate.day ||
      startDate.month !== editStartDate.month ||
      startDate.year !== editStartDate.year)
  )
}
