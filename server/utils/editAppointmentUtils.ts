import { Request } from 'express'
import {
  AppointmentApplyTo,
  AppointmentApplyToOption,
  AppointmentCancellationReason,
  AppointmentRepeatPeriod,
} from '../@types/appointments'
import { convertToTitleCase, formatDate, fullName } from './utils'
import { AppointmentJourney, AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'

export const getAppointmentBackLinkHref = (req: Request, defaultBackLinkHref: string) => {
  if (
    req.session.appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
    req.params.appointmentId &&
    req.params.occurrenceId
  ) {
    return `/appointments/${req.params.appointmentId}/occurrence/${req.params.occurrenceId}`
  }

  return defaultBackLinkHref
}

export const isApplyToQuestionRequired = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.occurrences?.length > 1

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
    updateProperties.push('extra information')
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

export const getConfirmAppointmentEditCta = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED) {
    return 'Cancel appointment'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'Delete appointment'
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
    updateProperties.push('extra information')
  }

  if (updateProperties.length > 0) {
    return `Update ${updateProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')}`
  }

  if (editAppointmentJourney.addPrisoners?.length === 1) {
    return 'Confirm add attendee'
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'Confirm add attendees'
  }

  if (editAppointmentJourney.removePrisoner) {
    return 'Confirm removal'
  }

  return ''
}

export const getAppointmentEditApplyToCta = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED) {
    return 'Cancel selection'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'Delete selection'
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
    updateProperties.push('extra information')
  }

  if (updateProperties.length > 0) {
    return `Update ${updateProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')}`
  }

  if (editAppointmentJourney.addPrisoners?.length === 1) {
    return 'Add attendee'
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'Add attendees'
  }

  if (editAppointmentJourney.removePrisoner) {
    return 'Remove attendee'
  }

  return ''
}

export const getAppointmentApplyToOptions = (req: Request) => {
  const { appointmentJourney, editAppointmentJourney } = req.session

  const applyToOptions = [
    {
      applyTo: AppointmentApplyTo.THIS_OCCURRENCE,
      description: `Just this one - ${formatDate(new Date(appointmentJourney.startDate.date), 'EEEE, d MMMM yyyy')} (${
        getOccurrence(editAppointmentJourney.sequenceNumber, editAppointmentJourney)?.sequenceNumber
      } of ${getLastOccurrence(editAppointmentJourney)?.sequenceNumber})`,
    },
  ] as AppointmentApplyToOption[]

  if (isApplyToQuestionRequired(editAppointmentJourney)) {
    if (isFirstRemainingOccurrence(editAppointmentJourney) || !isLastRemainingOccurrence(editAppointmentJourney)) {
      applyToOptions.push({
        applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_OCCURRENCES,
        description: isSecondLastRemainingOccurrence(editAppointmentJourney)
          ? 'This one and the appointment that comes after it in the series'
          : 'This one and all the appointments that come after it in the series',
        additionalDescription: `You're ${getEditHintAction(appointmentJourney, editAppointmentJourney)} the following ${
          getLastOccurrence(editAppointmentJourney).sequenceNumber - editAppointmentJourney.sequenceNumber + 1
        } appointments:<br>${formatDate(
          getOccurrence(editAppointmentJourney.sequenceNumber, editAppointmentJourney)?.startDate,
          'd MMMM yyyy',
        )} (${editAppointmentJourney.sequenceNumber} of ${
          getLastOccurrence(editAppointmentJourney).sequenceNumber
        }) to ${formatDate(getLastOccurrence(editAppointmentJourney).startDate, 'd MMMM yyyy')} (${
          getLastOccurrence(editAppointmentJourney).sequenceNumber
        } of ${getLastOccurrence(editAppointmentJourney).sequenceNumber})`,
      })
    }

    if (
      !isFirstRemainingOccurrence(editAppointmentJourney) &&
      !hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)
    ) {
      applyToOptions.push({
        applyTo: AppointmentApplyTo.ALL_FUTURE_OCCURRENCES,
        description: "This one and all the appointments in the series that haven't happened yet",
        additionalDescription: `You're ${getEditHintAction(appointmentJourney, editAppointmentJourney)} the following ${
          getLastOccurrence(editAppointmentJourney).sequenceNumber -
          getFirstOccurrence(editAppointmentJourney).sequenceNumber +
          1
        } appointments:<br>${formatDate(getFirstOccurrence(editAppointmentJourney).startDate, 'd MMMM yyyy')} (${
          getFirstOccurrence(editAppointmentJourney).sequenceNumber
        } of ${getLastOccurrence(editAppointmentJourney).sequenceNumber}) to ${formatDate(
          getLastOccurrence(editAppointmentJourney).startDate,
          'd MMMM yyyy',
        )} (${getLastOccurrence(editAppointmentJourney).sequenceNumber} of ${
          getLastOccurrence(editAppointmentJourney).sequenceNumber
        })`,
      })
    }
  }

  return applyToOptions
}

export const getRepeatFrequencyText = (appointmentJourney: AppointmentJourney) => {
  let frequencyText = 'This appointment repeats every '
  switch (appointmentJourney.repeatPeriod) {
    case AppointmentRepeatPeriod.WEEKDAY:
      frequencyText += 'week day'
      break
    case AppointmentRepeatPeriod.DAILY:
      frequencyText += 'day'
      break
    case AppointmentRepeatPeriod.WEEKLY:
      frequencyText += 'week'
      break
    case AppointmentRepeatPeriod.FORTNIGHTLY:
      frequencyText += 'fortnight'
      break
    case AppointmentRepeatPeriod.MONTHLY:
      frequencyText += 'month'
      break
    default:
      return null
  }

  return frequencyText
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

export const getOrderedOccurrences = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.occurrences.sort((a, b) => a.sequenceNumber - b.sequenceNumber)

export const getFirstOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  getOrderedOccurrences(editAppointmentJourney)[0]

export const getLastOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  getOrderedOccurrences(editAppointmentJourney).slice(-1)[0]

const getOccurrence = (sequenceNumber: number, editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.occurrences.find(o => o.sequenceNumber === sequenceNumber)

const isFirstRemainingOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.sequenceNumber === getFirstOccurrence(editAppointmentJourney).sequenceNumber

const isSecondLastRemainingOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.occurrences.length > 2 &&
  editAppointmentJourney.sequenceNumber === getOrderedOccurrences(editAppointmentJourney).slice(-2)[0]?.sequenceNumber

const isLastRemainingOccurrence = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.sequenceNumber === getLastOccurrence(editAppointmentJourney).sequenceNumber

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
) => editAppointmentJourney.comment !== undefined && appointmentJourney.comment !== editAppointmentJourney.comment
