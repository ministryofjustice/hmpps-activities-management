import { Request } from 'express'
import {
  AppointmentApplyTo,
  AppointmentApplyToOption,
  AppointmentCancellationReason,
  AppointmentFrequency,
} from '../@types/appointments'
import { convertToTitleCase, formatDate, fullName } from './utils'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { parseIsoDate } from './datePickerUtils'

export const isApplyToQuestionRequired = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.appointments?.length > 1

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
  if (hasAppointmentTierChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('tier')
  }

  if (hasAppointmentOrganiserChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('host')
  }

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
    return 'add these people to'
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
    return 'Confirm'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'Delete appointment'
  }

  const updateProperties = []
  if (hasAppointmentTierChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('tier')
  }

  if (hasAppointmentOrganiserChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('host')
  }

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
    return 'Confirm'
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'Confirm'
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
    return 'Confirm'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'Confirm'
  }

  const updateProperties = []
  if (hasAppointmentTierChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('tier')
  }

  if (hasAppointmentOrganiserChanged(appointmentJourney, editAppointmentJourney)) {
    updateProperties.push('host')
  }

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
    return 'Confirm'
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'Confirm'
  }

  if (editAppointmentJourney.removePrisoner) {
    return 'Confirm'
  }

  return ''
}

export const getAppointmentApplyToOptions = (req: Request) => {
  const { appointmentJourney, editAppointmentJourney } = req.session

  const applyToOptions = [
    {
      applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
      description: `Just this one - ${formatDate(
        parseIsoDate(appointmentJourney.startDate),
        'EEEE, d MMMM yyyy',
      )} (${getAppointment(editAppointmentJourney.sequenceNumber, editAppointmentJourney)
        ?.sequenceNumber} of ${getLastAppointment(editAppointmentJourney)?.sequenceNumber})`,
    },
  ] as AppointmentApplyToOption[]

  if (isApplyToQuestionRequired(editAppointmentJourney)) {
    const lastAppointment = getLastAppointment(editAppointmentJourney)
    const editHint = getEditHintAction(appointmentJourney, editAppointmentJourney)
    if (isFirstRemainingAppointment(editAppointmentJourney) || !isLastRemainingAppointment(editAppointmentJourney)) {
      const applyToCount = applyToAppointmentCount(
        AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
        editAppointmentJourney,
      )
      applyToOptions.push({
        applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
        description: isSecondLastRemainingAppointment(editAppointmentJourney)
          ? 'This one and the appointment that comes after it in the series'
          : 'This one and all the appointments that come after it in the series',
        additionalDescription: `You're ${editHint} the following ${applyToCount} appointments:<br>${formatDate(
          getAppointment(editAppointmentJourney.sequenceNumber, editAppointmentJourney)?.startDate,
          'd MMMM yyyy',
        )} (${editAppointmentJourney.sequenceNumber} of ${lastAppointment.sequenceNumber}) to ${formatDate(
          lastAppointment.startDate,
          'd MMMM yyyy',
        )} (${lastAppointment.sequenceNumber} of ${lastAppointment.sequenceNumber})`,
      })
    }

    if (
      !isFirstRemainingAppointment(editAppointmentJourney) &&
      !hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney)
    ) {
      const applyToCount = applyToAppointmentCount(AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS, editAppointmentJourney)
      applyToOptions.push({
        applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
        description: "This one and all the appointments in the series that haven't happened yet",
        additionalDescription: `You're ${editHint} the following ${applyToCount} appointments:<br>${formatDate(
          getFirstAppointment(editAppointmentJourney).startDate,
          'd MMMM yyyy',
        )} (${getFirstAppointment(editAppointmentJourney).sequenceNumber} of ${
          lastAppointment.sequenceNumber
        }) to ${formatDate(lastAppointment.startDate, 'd MMMM yyyy')} (${lastAppointment.sequenceNumber} of ${
          lastAppointment.sequenceNumber
        })`,
      })
    }
  }

  return applyToOptions
}

export const applyToAppointmentCount = (
  applyTo: AppointmentApplyTo,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  if (applyTo === AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS) {
    return getLastAppointment(editAppointmentJourney).sequenceNumber - editAppointmentJourney.sequenceNumber + 1
  }
  if (applyTo === AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS) {
    return (
      getLastAppointment(editAppointmentJourney).sequenceNumber -
      getFirstAppointment(editAppointmentJourney).sequenceNumber +
      1
    )
  }
  return 1
}

export const getRepeatFrequencyText = (appointmentJourney: AppointmentJourney) => {
  let frequencyText = 'This appointment repeats every '
  switch (appointmentJourney.frequency) {
    case AppointmentFrequency.WEEKDAY:
      frequencyText += 'weekday (Monday to Friday)'
      break
    case AppointmentFrequency.DAILY:
      frequencyText += 'day'
      break
    case AppointmentFrequency.WEEKLY:
      frequencyText += 'week'
      break
    case AppointmentFrequency.FORTNIGHTLY:
      frequencyText += 'fortnight'
      break
    case AppointmentFrequency.MONTHLY:
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

export const getOrderedAppointments = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.appointments.sort((a, b) => a.sequenceNumber - b.sequenceNumber)

export const getFirstAppointment = (editAppointmentJourney: EditAppointmentJourney) =>
  getOrderedAppointments(editAppointmentJourney)[0]

export const getLastAppointment = (editAppointmentJourney: EditAppointmentJourney) =>
  getOrderedAppointments(editAppointmentJourney).slice(-1)[0]

const getAppointment = (sequenceNumber: number, editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.appointments.find(o => o.sequenceNumber === sequenceNumber)

const isFirstRemainingAppointment = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.sequenceNumber === getFirstAppointment(editAppointmentJourney).sequenceNumber

const isSecondLastRemainingAppointment = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.appointments.length > 2 &&
  editAppointmentJourney.sequenceNumber === getOrderedAppointments(editAppointmentJourney).slice(-2)[0]?.sequenceNumber

const isLastRemainingAppointment = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.sequenceNumber === getLastAppointment(editAppointmentJourney).sequenceNumber

export const hasAnyAppointmentPropertyChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) =>
  hasAppointmentTierChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentOrganiserChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentLocationChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentStartTimeChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentEndTimeChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentCommentChanged(appointmentJourney, editAppointmentJourney) ||
  hasAppointmentAttendeesChanged(editAppointmentJourney)

export const hasAppointmentTierChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => editAppointmentJourney.tierCode && appointmentJourney.tierCode !== editAppointmentJourney.tierCode

export const hasAppointmentOrganiserChanged = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => editAppointmentJourney.organiserCode && appointmentJourney.organiserCode !== editAppointmentJourney.organiserCode

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
  return editStartDate && startDate !== editStartDate
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
) =>
  editAppointmentJourney.extraInformation !== undefined &&
  appointmentJourney.extraInformation !== editAppointmentJourney.extraInformation

export const hasAppointmentAttendeesChanged = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.addPrisoners || editAppointmentJourney.removePrisoner
