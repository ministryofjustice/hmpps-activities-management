import { Request } from 'express'
import { startOfToday, subDays } from 'date-fns'
import {
  AppointmentApplyTo,
  AppointmentApplyToOption,
  AppointmentCancellationReason,
  AppointmentFrequency,
} from '../@types/appointments'
import { convertToTitleCase, formatDate, fullName, parseDate, toDate } from './utils'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import { EditAppointmentJourney } from '../routes/appointments/create-and-edit/editAppointmentJourney'
import { parseIsoDate } from './datePickerUtils'
import { AppointmentDetails } from '../@types/activitiesAPI/types'

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

  if (editAppointmentJourney.uncancel) {
    return 'uncancel'
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

  if (editAppointmentJourney.uncancel) {
    return 'Continue'
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

  if (editAppointmentJourney.uncancel) {
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

export const getAppointmentEditHintMessage = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  const currentAppointment = getAppointment(editAppointmentJourney.sequenceNumber, editAppointmentJourney)
  const lastAppointment = getLastAppointment(editAppointmentJourney)
  const applyToCount = applyToAppointmentCount(
    AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
    editAppointmentJourney,
  )

  if (
    editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED ||
    editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR
  ) {
    return `There are ${applyToCount} appointments left in this series. They run from ${formatDate(
      currentAppointment?.startDate,
      'd MMMM yyyy',
    )} to ${formatDate(lastAppointment?.startDate, 'd MMMM yyyy')}.`
  }

  if (editAppointmentJourney.uncancel) {
    return `There are ${applyToCount} cancelled appointments in this series that can still be uncancelled.
    They were due to run from ${formatDate(currentAppointment?.startDate, 'd MMMM yyyy')} to ${formatDate(
      lastAppointment?.startDate,
      'd MMMM yyyy',
    )}.`
  }

  return ''
}

export const getAppointmentEditHeadingMessage = (
  appointmentJourney: AppointmentJourney,
  editAppointmentJourney: EditAppointmentJourney,
) => {
  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED) {
    return 'This appointment is in a series: select which appointments you want to cancel?'
  }

  if (editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR) {
    return 'This appointment is in a series: select which appointments you want to delete?'
  }

  if (editAppointmentJourney.uncancel) {
    return 'This cancelled appointment is in a series: select which appointments you want to uncancel?'
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
    return `Which appointments do you want to change the ${updateProperties.join(', ').replace(/(,)(?!.*\1)/, ' and')} for?`
  }

  if (editAppointmentJourney.addPrisoners?.length === 1) {
    return `Which appointments do you want to add ${convertToTitleCase(editAppointmentJourney.addPrisoners[0].name)} to?`
  }

  if (editAppointmentJourney.addPrisoners?.length > 1) {
    return 'Which appointments do you want to add these people to?'
  }

  if (editAppointmentJourney.removePrisoner) {
    return `Which appointments do you want to remove ${convertToTitleCase(fullName(editAppointmentJourney.removePrisoner))} from?`
  }

  return ''
}

export const getAppointmentApplyToOptions = (req: Request) => {
  const { appointmentJourney, editAppointmentJourney } = req.session
  const currentAppointment = getAppointment(editAppointmentJourney.sequenceNumber, editAppointmentJourney)
  const firstAppointment = getFirstAppointment(editAppointmentJourney)
  const lastAppointment = getLastAppointment(editAppointmentJourney)

  const applyToOptions = [
    {
      applyTo: AppointmentApplyTo.THIS_APPOINTMENT,
      description: `Just this one - ${formatDate(parseIsoDate(appointmentJourney.startDate), 'EEEE, d MMMM yyyy')} (${
        currentAppointment?.sequenceNumber
      } of ${lastAppointment?.sequenceNumber})`,
    },
  ] as AppointmentApplyToOption[]

  if (isApplyToQuestionRequired(editAppointmentJourney)) {
    const editHint = getEditHintAction(appointmentJourney, editAppointmentJourney)

    if (isFirstRemainingAppointment(editAppointmentJourney) || !isLastRemainingAppointment(editAppointmentJourney)) {
      const applyToCount = applyToAppointmentCount(
        AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
        editAppointmentJourney,
      )

      if (
        editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED ||
        editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR
      ) {
        applyToOptions.push({
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: isSecondLastRemainingAppointment(editAppointmentJourney)
            ? 'This one and the appointment that comes after it'
            : `This one and all ${applyToCount} appointments that come after it`,
        })
      } else if (editAppointmentJourney.uncancel) {
        applyToOptions.push({
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: isSecondLastRemainingAppointment(editAppointmentJourney)
            ? 'This one and the cancelled appointment that comes after it'
            : `This one and all ${applyToCount} cancelled appointments that come after it`,
        })
      } else {
        applyToOptions.push({
          applyTo: AppointmentApplyTo.THIS_AND_ALL_FUTURE_APPOINTMENTS,
          description: isSecondLastRemainingAppointment(editAppointmentJourney)
            ? 'This one and the appointment that comes after it in the series'
            : 'This one and all the appointments that come after it in the series',
          additionalDescription: `You're ${editHint} the following ${applyToCount} appointments:<br>${formatDate(
            currentAppointment?.startDate,
            'd MMMM yyyy',
          )} (${editAppointmentJourney.sequenceNumber} of ${lastAppointment.sequenceNumber}) to ${formatDate(
            lastAppointment.startDate,
            'd MMMM yyyy',
          )} (${lastAppointment.sequenceNumber} of ${lastAppointment.sequenceNumber})`,
        })
      }
    }
    if (
      !isFirstRemainingAppointment(editAppointmentJourney) &&
      !hasAppointmentStartDateChanged(appointmentJourney, editAppointmentJourney) &&
      !isUncancelAndAllFutureNotCancelled(editAppointmentJourney)
    ) {
      const applyToCount = applyToAppointmentCount(AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS, editAppointmentJourney)

      if (
        editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CANCELLED ||
        editAppointmentJourney.cancellationReason === AppointmentCancellationReason.CREATED_IN_ERROR
      ) {
        applyToOptions.push({
          applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          description: `All ${applyToCount} appointments left in this series`,
        })
      } else if (editAppointmentJourney.uncancel) {
        applyToOptions.push({
          applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          description: `This one and all ${applyToCount} cancelled appointments that were not due to have happened yet`,
        })
      } else {
        applyToOptions.push({
          applyTo: AppointmentApplyTo.ALL_FUTURE_APPOINTMENTS,
          description: "This one and all the appointments in the series that haven't happened yet",
          additionalDescription: `You're ${editHint} the following ${applyToCount} appointments:<br>${formatDate(
            firstAppointment.startDate,
            'd MMMM yyyy',
          )} (${firstAppointment.sequenceNumber} of ${
            lastAppointment.sequenceNumber
          }) to ${formatDate(lastAppointment.startDate, 'd MMMM yyyy')} (${lastAppointment.sequenceNumber} of ${
            lastAppointment.sequenceNumber
          })`,
        })
      }
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

  if (editAppointmentJourney.uncancel === true) {
    return 'uncancelling'
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
) => {
  const oldLocationId = appointmentJourney.location?.id
  const newLocationId = editAppointmentJourney.location?.id
  const oldInCell = appointmentJourney.inCell
  const newInCell = editAppointmentJourney.inCell

  if (newLocationId) {
    return oldLocationId !== newLocationId
  }
  if (newInCell) {
    return newInCell !== oldInCell
  }
  return false
}

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

export function isUncancellable(appointment: AppointmentDetails): boolean {
  return appointment.isCancelled && parseDate(appointment.startDate) > subDays(startOfToday(), 6)
}

const isUncancelAndAllFutureNotCancelled = (editAppointmentJourney: EditAppointmentJourney) =>
  editAppointmentJourney.uncancel &&
  editAppointmentJourney.appointments.some(i => toDate(i.startDate) >= startOfToday() && i.cancelled === false)
