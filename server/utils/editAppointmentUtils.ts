import { Request } from 'express'
import { AppointmentApplyTo, AppointmentApplyToOption, AppointmentCancellationReason } from '../@types/appointments'
import { convertToTitleCase, formatDate, fullName } from './utils'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'

export const isApplyToQuestionRequired = (editAppointmentJourney: EditAppointmentJourney) =>
  Array.isArray(editAppointmentJourney.sequenceNumbers) && editAppointmentJourney.sequenceNumbers.length > 1

export const getAppointmentEditMessage = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED) {
    return 'cancel'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'delete'
  }

  const updateProperties = []
  if (hasAppointmentLocationChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('location')
  }

  if (hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('date')
  }

  if (
    hasAppointmentStartTimeChanged(appointmentJourney, editAppointmentJourney) ||
    hasAppointmentEndTimeChanged(appointmentJourney, editAppointmentJourney)
  ) {
    updateProperties.push('time')
  }

  if (hasAppointmentCommentChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('heads up')
  }

  if (updateProperties.length > 0) {
    return `change the ${updateProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')} for`
  }

  if (editAppointmentJourney.addPrisoners?.length === 1) {
    return `add ${convertToTitleCase(editAppointmentJourney.addPrisoners[0].name)} to`
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'add the people to'
  }

  if (editAppointmentJourney.removePrisoner) {
    return `remove ${convertToTitleCase(fullName(editAppointmentJourney.removePrisoner))} from`
  }

  return ''
}

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
      !hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)
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

export const hasAnyAppointmentPropertyChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) =>
  hasAppointmentLocationChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentStartTimeChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentEndTimeChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentCommentChanged(appointmentJourney, editAppointmentJourney)

export const hasAppointmentLocationChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => editAppointmentJourney.location && appointmentJourney.location.id !== editAppointmentJourney.location.id

export const hasAppointmentStartDateChanged = (
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

export const hasAppointmentStartTimeChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  const { startTime } = appointmentJourney
  const editStartTime = editAppointmentJourney.startTime
  return editStartTime && (startTime.hour !== editStartTime.hour || startTime.minute !== editStartTime.minute)
}

export const hasAppointmentEndTimeChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  const { endTime } = appointmentJourney
  const editEndTime = editAppointmentJourney.endTime
  return editEndTime && (!endTime || endTime.hour !== editEndTime.hour || endTime.minute !== editEndTime.minute)
}

export const hasAppointmentCommentChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => editAppointmentJourney.comment && appointmentJourney.comment !== editAppointmentJourney.comment
